from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db

from app.models.user import User
from app.models.item import Item
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.sale_payment import SalePayment
from app.models.stock_movement import StockMovement
from app.models.audit_log import AuditLog
from app.dependencies.auth import get_current_user
from app.schemas.sale import SaleCreate


router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


# ============================================================
# CREATE SALE
# ============================================================

@router.post("")
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # 1. DUPLICATE REQUEST PROTECTION
    # --------------------------------------------------------

    existing_sale = (
        db.query(Sale)
        .filter(
            Sale.idempotency_key
            == data.idempotency_key
        )
        .first()
    )

    if existing_sale:
        return build_sale_response(
            existing_sale,
            change=0,
        )

    # --------------------------------------------------------
    # 2. BASIC VALIDATION
    # --------------------------------------------------------

    if not data.items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty",
        )

    if not data.payments:
        raise HTTPException(
            status_code=400,
            detail="Payment is required",
        )

    # --------------------------------------------------------
    # 3. LOAD ITEMS + VALIDATE STOCK
    # --------------------------------------------------------

    subtotal = 0.0
    tax_total = 0.0

    sale_items_data = []

    for requested_item in data.items:

        item = (
            db.query(Item)
            .filter(
                Item.id == requested_item.item_id,
                Item.is_active == True,
            )
            .first()
        )

        if not item:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Item {requested_item.item_id} "
                    "not found"
                ),
            )

        if requested_item.quantity > item.current_stock:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for "
                    f"{item.name}. "
                    f"Available: "
                    f"{item.current_stock}"
                ),
            )

        unit_price = float(
            item.selling_price
        )

        quantity = requested_item.quantity

        line_subtotal = (
            unit_price * quantity
        )

        tax_rate = float(
            item.tax_rate or 0
        )

        item_tax = (
            line_subtotal
            * tax_rate
            / 100
        )

        line_total = (
            line_subtotal
            + item_tax
        )

        subtotal += line_subtotal
        tax_total += item_tax

        sale_items_data.append(
            {
                "item": item,
                "quantity": quantity,
                "unit_price": unit_price,
                "tax_rate": tax_rate,
                "tax": item_tax,
                "line_total": line_total,
            }
        )

    # --------------------------------------------------------
    # 4. ROUND TOTALS
    # --------------------------------------------------------

    subtotal = round(
        subtotal,
        2,
    )

    tax_total = round(
        tax_total,
        2,
    )

    # --------------------------------------------------------
    # 5. DISCOUNT
    # --------------------------------------------------------

    discount = float(
        data.discount or 0
    )

    discount = round(
        discount,
        2,
    )

    if discount > subtotal:
        raise HTTPException(
            status_code=400,
            detail=(
                "Discount cannot exceed "
                "subtotal"
            ),
        )

    # --------------------------------------------------------
    # 6. GRAND TOTAL
    # --------------------------------------------------------

    grand_total = (
        subtotal
        - discount
        + tax_total
    )

    grand_total = round(
        grand_total,
        2,
    )

    # --------------------------------------------------------
    # 7. PAYMENT VALIDATION
    # --------------------------------------------------------

    payment_total = 0.0

    normalized_payments = []

    for payment in data.payments:

        method = (
            payment.payment_method
            .strip()
            .upper()
        )

        amount = round(
            float(payment.amount),
            2,
        )

        if method not in [
            "CASH",
            "CARD",
        ]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid payment method. "
                    "Use CASH or CARD."
                ),
            )

        if amount <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Payment amount must be "
                    "greater than zero"
                ),
            )

        payment_total += amount

        normalized_payments.append(
            {
                "payment_method": method,
                "amount": amount,
            }
        )

    payment_total = round(
        payment_total,
        2,
    )

    # --------------------------------------------------------
    # 8. PAYMENT RULES
    # --------------------------------------------------------

    if payment_total < grand_total:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Payment incomplete. "
                f"Amount due: "
                f"{grand_total:.2f}, "
                f"received: "
                f"{payment_total:.2f}"
            ),
        )

    has_cash = any(
        payment["payment_method"] == "CASH"
        for payment in normalized_payments
    )

    # Card-only cannot overpay
    if (
        not has_cash
        and payment_total > grand_total
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Card payment cannot "
                "exceed amount due"
            ),
        )

    # --------------------------------------------------------
    # 9. CALCULATE CHANGE
    # --------------------------------------------------------

    change = 0.0

    if has_cash:
        change = round(
            payment_total - grand_total,
            2,
        )

    # --------------------------------------------------------
    # 10. GENERATE INVOICE NUMBER
    # --------------------------------------------------------

    last_sale_id = (
        db.query(func.max(Sale.id))
        .scalar()
    )

    next_number = (
        (last_sale_id or 0) + 1
    )

    invoice_number = (
        f"INV-{next_number:06d}"
    )

    # --------------------------------------------------------
    # 11. CREATE SALE
    # --------------------------------------------------------

    sale = Sale(
        invoice_number=invoice_number,
        cashier_id=user.id,
        subtotal=subtotal,
        discount=discount,
        tax=tax_total,
        grand_total=grand_total,
        status="COMPLETED",
        idempotency_key=data.idempotency_key,
    )

    db.add(sale)

    # Get sale.id before creating child records
    db.flush()

    # --------------------------------------------------------
    # 12. CREATE SALE ITEMS + UPDATE STOCK
    # --------------------------------------------------------

    for sale_data in sale_items_data:

        item = sale_data["item"]

        quantity = sale_data["quantity"]

        stock_before = item.current_stock

        item.current_stock -= quantity

        stock_after = item.current_stock

        # -----------------------------------------------
        # SALE ITEM
        # -----------------------------------------------

        sale_item = SaleItem(
            sale_id=sale.id,
            item_id=item.id,
            quantity=quantity,
            unit_price=sale_data["unit_price"],
            tax=sale_data["tax"],
            line_total=sale_data["line_total"],
        )

        db.add(sale_item)

        # -----------------------------------------------
        # STOCK MOVEMENT
        # -----------------------------------------------

        movement = StockMovement(
            item_id=item.id,
            user_id=user.id,
            movement_type="SALE",
            quantity_change=-quantity,
            stock_before=stock_before,
            stock_after=stock_after,
            reason=(
                f"Sale {invoice_number}"
            ),
            created_by=user.id,
        )

        db.add(movement)

    # --------------------------------------------------------
    # 13. SAVE PAYMENTS
    # --------------------------------------------------------

    for payment in normalized_payments:

        sale_payment = SalePayment(
            sale_id=sale.id,
            payment_method=(
                payment["payment_method"]
            ),
            amount=payment["amount"],
        )

        db.add(sale_payment)

    # --------------------------------------------------------
    # 14. COMMIT EVERYTHING
    # --------------------------------------------------------

    try:

        db.commit()

        db.refresh(sale)

    except Exception as e:

        db.rollback()

        print(
            "SALE DATABASE ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail="Sale could not be completed.",
        )

    # --------------------------------------------------------
    # 15. RETURN COMPLETE RECEIPT
    # --------------------------------------------------------

    return build_sale_response(
        sale,
        change=change,
    )


# ============================================================
# BUILD COMPLETE RECEIPT RESPONSE
# ============================================================

def build_sale_response(
    sale: Sale,
    change: float = 0,
):

    return {
        "id": sale.id,

        "invoice_number":
            sale.invoice_number,

        "created_at":
            sale.created_at.isoformat(),

        "cashier_id":
            sale.cashier_id,

        "cashier_name":
            (
                sale.cashier.name
                if sale.cashier
                else "Cashier"
            ),

        "subtotal":
            float(sale.subtotal),

        "discount":
            float(sale.discount),

        "tax":
            float(sale.tax),

        "grand_total":
            float(sale.grand_total),

        "change":
            round(change, 2),

        "status":
            sale.status,

        # ----------------------------------------------------
        # PURCHASED ITEMS
        # ----------------------------------------------------

        "items": [
            {
                "item_id":
                    sale_item.item_id,

                "name":
                    (
                        sale_item.item.name
                        if sale_item.item
                        else "Item"
                    ),

                "sku":
                    (
                        sale_item.item.sku
                        if sale_item.item
                        else ""
                    ),

                "barcode":
                    (
                        sale_item.item.barcode
                        if sale_item.item
                        else ""
                    ),

                "quantity":
                    sale_item.quantity,

                "unit_price":
                    float(
                        sale_item.unit_price
                    ),

                "tax_rate":
                    (
                        float(
                            sale_item.item.tax_rate
                        )
                        if sale_item.item
                        else 0
                    ),

                "tax":
                    float(
                        sale_item.tax
                    ),

                "line_total":
                    float(
                        sale_item.line_total
                    ),
            }

            for sale_item in sale.items
        ],

        # ----------------------------------------------------
        # PAYMENTS
        # ----------------------------------------------------

        "payments": [
            {
                "payment_method":
                    payment.payment_method,

                "amount":
                    float(
                        payment.amount
                    ),
            }

            for payment in sale.payments
        ],
    }


# ============================================================
# GET SALES
# ============================================================

# ============================================================
# GET SALES
# ============================================================

@router.get("")
def get_sales(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    sales = (
        db.query(Sale)
        .order_by(
            Sale.created_at.desc()
        )
        .all()
    )

    result = []

    for sale in sales:

        # ----------------------------------------------------
        # PAYMENT METHOD
        # ----------------------------------------------------

        payment_methods = [
            payment.payment_method
            for payment in sale.payments
        ]

        if len(set(payment_methods)) > 1:

            payment_method = "Split"

        elif payment_methods:

            payment_method = (
                payment_methods[0].title()
            )

        else:

            payment_method = "Unknown"

        # ----------------------------------------------------
        # SALES HISTORY RESPONSE
        # ----------------------------------------------------

        result.append(
            {
                "id":
                    sale.id,

                "invoice":
                    sale.invoice_number,

                # IMPORTANT:
                # Send the original database datetime
                # to frontend for accurate Today filtering.
                "created_at":
                    sale.created_at.isoformat()
                    if sale.created_at
                    else None,

                # Display-only date
                "date":
                    sale.created_at.strftime(
                        "%d %b %Y"
                    )
                    if sale.created_at
                    else "",

                # Display-only time
                "time":
                    sale.created_at.strftime(
                        "%I:%M %p"
                    )
                    if sale.created_at
                    else "",

                "cashier":
                    (
                        sale.cashier.name
                        if sale.cashier
                        else "Unknown"
                    ),

                "cashier_id":
                    sale.cashier_id,

                "items":
                    sum(
                        sale_item.quantity
                        for sale_item
                        in sale.items
                    ),

                "subtotal":
                    float(
                        sale.subtotal
                    ),

                "discount":
                    float(
                        sale.discount
                    ),

                "tax":
                    float(
                        sale.tax
                    ),

                "total":
                    float(
                        sale.grand_total
                    ),

                "payment":
                    payment_method,

                "status":
                    sale.status,

                "payments":
                    [
                        {
                            "payment_method":
                                payment.payment_method,

                            "amount":
                                float(
                                    payment.amount
                                ),
                        }

                        for payment
                        in sale.payments
                    ],
            }
        )

    return result
@router.get("/{sale_id}")
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # FIND SALE
    # --------------------------------------------------------

    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id
        )
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found",
        )

    # --------------------------------------------------------
    # GET PAYMENT METHODS
    # --------------------------------------------------------

    payment_methods = [
        payment.payment_method
        for payment in sale.payments
    ]

    if len(set(payment_methods)) > 1:
        payment_method = "Split"

    elif payment_methods:
        payment_method = (
            payment_methods[0].title()
        )

    else:
        payment_method = "Unknown"

    # --------------------------------------------------------
    # RETURN COMPLETE SALE
    # --------------------------------------------------------

    return {
        "id": sale.id,

        "invoice_number":
            sale.invoice_number,

        "created_at":
            sale.created_at.isoformat(),

        "cashier_id":
            sale.cashier_id,

        "cashier_name":
            (
                sale.cashier.name
                if sale.cashier
                else "Unknown"
            ),

        "subtotal":
            float(sale.subtotal),

        "discount":
            float(sale.discount),

        "tax":
            float(sale.tax),

        "grand_total":
            float(sale.grand_total),

        "total":
            float(sale.grand_total),

        "status":
            sale.status,

        "payment":
            payment_method,

        # ----------------------------------------------------
        # ITEMS
        # ----------------------------------------------------

        "items": [
            {
                "item_id":
                    sale_item.item_id,

                "name":
                    (
                        sale_item.item.name
                        if sale_item.item
                        else "Unknown Item"
                    ),

                "sku":
                    (
                        sale_item.item.sku
                        if sale_item.item
                        else ""
                    ),

                "barcode":
                    (
                        sale_item.item.barcode
                        if sale_item.item
                        else ""
                    ),

                "quantity":
                    sale_item.quantity,

                "unit_price":
                    float(
                        sale_item.unit_price
                    ),

                "tax_rate":
                    (
                        float(
                            sale_item.item.tax_rate
                        )
                        if sale_item.item
                        else 0
                    ),

                "tax":
                    float(
                        sale_item.tax
                    ),

                "line_total":
                    float(
                        sale_item.line_total
                    ),
            }

            for sale_item
            in sale.items
        ],

        # ----------------------------------------------------
        # PAYMENTS
        # ----------------------------------------------------

        "payments": [
            {
                "payment_method":
                    payment.payment_method,

                "amount":
                    float(
                        payment.amount
                    ),
            }

            for payment
            in sale.payments
        ],
    }

def require_admin(user: User):
    role = str(user.role or "").upper()

    if role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only Admin users can void sales.",
        )


# ============================================================
# VOID SALE
# ============================================================

@router.post("/{sale_id}/void")
def void_sale(
    sale_id: int,
    data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # 1. ADMIN ONLY
    # --------------------------------------------------------

    require_admin(user)

    # --------------------------------------------------------
    # 2. GET REASON
    # --------------------------------------------------------

    reason = str(
        data.get("reason", "")
    ).strip()

    if not reason:
        raise HTTPException(
            status_code=400,
            detail="Void reason is required.",
        )

    if len(reason) > 255:
        raise HTTPException(
            status_code=400,
            detail="Void reason must be 255 characters or less.",
        )

    # --------------------------------------------------------
    # 3. FIND SALE
    # --------------------------------------------------------

    sale = (
        db.query(Sale)
        .filter(Sale.id == sale_id)
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found.",
        )

    # --------------------------------------------------------
    # 4. SALE MUST BE COMPLETED
    # --------------------------------------------------------

    if str(sale.status).upper() != "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail=(
                f"Sale cannot be voided because its "
                f"current status is {sale.status}."
            ),
        )

    # --------------------------------------------------------
    # 5. DATABASE TRANSACTION
    # --------------------------------------------------------

    try:

        # ----------------------------------------------------
        # RESTORE STOCK
        # ----------------------------------------------------

        for sale_item in sale.items:

            item = (
                db.query(Item)
                .filter(
                    Item.id == sale_item.item_id
                )
                .with_for_update()
                .first()
            )

            if not item:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Item {sale_item.item_id} "
                        f"not found."
                    ),
                )

            stock_before = item.current_stock

            quantity_restored = int(
                sale_item.quantity
            )

            stock_after = (
                stock_before +
                quantity_restored
            )

            # Restore inventory
            item.current_stock = stock_after

            # ------------------------------------------------
            # STOCK MOVEMENT
            # ------------------------------------------------

            movement = StockMovement(
                item_id=item.id,
                user_id=user.id,
                movement_type="VOID",
                quantity_change=quantity_restored,
                stock_before=stock_before,
                stock_after=stock_after,
                reason=(
                    f"Void sale "
                    f"{sale.invoice_number}: "
                    f"{reason}"
                ),
                created_by=user.id,
            )

            db.add(movement)

        # ----------------------------------------------------
        # CHANGE SALE STATUS
        # ----------------------------------------------------

        sale.status = "VOIDED"
        sale.voided_at = datetime.utcnow()

        # ----------------------------------------------------
        # AUDIT LOG
        # ----------------------------------------------------

        audit = AuditLog(
    user_id=user.id,
    action="VOID_SALE",
    invoice_number=sale.invoice_number,
    reason=reason,
    created_at=datetime.utcnow(),
)

        db.add(audit)

        # ----------------------------------------------------
        # COMMIT EVERYTHING TOGETHER
        # ----------------------------------------------------

        db.commit()

        db.refresh(sale)

        return {
            "success": True,
            "message": "Sale voided successfully.",
            "sale_id": sale.id,
            "invoice_number": sale.invoice_number,
            "status": sale.status,
            "voided_at": sale.voided_at.isoformat()
            if sale.voided_at
            else None,
            "voided_by": user.name,
            "reason": reason,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        print(
            "VOID SALE ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to void sale.",
        )