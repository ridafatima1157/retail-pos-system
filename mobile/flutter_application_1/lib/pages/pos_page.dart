import 'package:flutter/material.dart';

import '../models/item.dart';
import '../services/item_service.dart';
import 'barcode_scanner_page.dart';
import 'payment_page.dart';
import 'sales_history_page.dart';

class CartItem {
  final Item item;
  int quantity;

  CartItem({
    required this.item,
    this.quantity = 1,
  });

  double get total {
    return item.sellingPrice * quantity;
  }
}

class PosPage extends StatefulWidget {
  const PosPage({super.key});

  @override
  State<PosPage> createState() => _PosPageState();
}

class _PosPageState extends State<PosPage> {
  final ItemService itemService = ItemService();

  final TextEditingController searchController =
      TextEditingController();

  List<Item> items = [];
  List<CartItem> cart = [];

  bool isLoading = true;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();

    // IMPORTANT:
    // Do not call loadItems() directly from initState().
    // Wait until the first frame is complete.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      loadItems();
    });
  }

  // ==========================================================
  // LOAD ITEMS
  // ==========================================================

  Future<void> loadItems() async {
    if (!mounted) return;

    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    try {
      final query = searchController.text.trim();

      debugPrint('');
      debugPrint('==========================================');
      debugPrint('POS - LOADING ITEMS');
      debugPrint('Search: "$query"');
      debugPrint('==========================================');

      final result = await itemService.getItems(
        search: query,
      );

      debugPrint('');
      debugPrint('==========================================');
      debugPrint(
        'POS - BACKEND RETURNED ${result.length} ITEMS',
      );
      debugPrint('==========================================');

      for (final item in result) {
        debugPrint(
          'ITEM -> '
          'id=${item.id}, '
          'name=${item.name}, '
          'sku=${item.sku}, '
          'barcode=${item.barcode}, '
          'stock=${item.currentStock}, '
          'price=${item.sellingPrice}, '
          'tax=${item.taxRate}',
        );
      }

      if (!mounted) return;

      setState(() {
        items = result;
        isLoading = false;
        errorMessage = '';
      });
    } catch (e, stackTrace) {
      debugPrint('');
      debugPrint('==========================================');
      debugPrint('POS - LOAD ITEMS ERROR');
      debugPrint('$e');
      debugPrint('==========================================');

      debugPrintStack(
        stackTrace: stackTrace,
      );

      if (!mounted) return;

      setState(() {
        isLoading = false;
        errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '');
      });
    }
  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  Future<void> searchItems() async {
    FocusScope.of(context).unfocus();

    await loadItems();
  }

  // ==========================================================
  // BARCODE
  // ==========================================================

  Future<void> scanBarcode() async {
    FocusScope.of(context).unfocus();

    final barcode = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (_) => const BarcodeScannerPage(),
      ),
    );

    if (!mounted ||
        barcode == null ||
        barcode.trim().isEmpty) {
      return;
    }

    try {
      debugPrint(
        'POS - Searching barcode: $barcode',
      );

      final item = await itemService.getItemByBarcode(
        barcode.trim(),
      );

      if (!mounted) return;

      addToCart(item);

      showMessage(
        '${item.name} added to cart',
      );
    } catch (e, stackTrace) {
      debugPrint(
        'POS BARCODE ERROR: $e',
      );

      debugPrintStack(
        stackTrace: stackTrace,
      );

      if (!mounted) return;

      showMessage(
        'Item not found for barcode: $barcode',
      );
    }
  }

  // ==========================================================
  // CART
  // ==========================================================

  void addToCart(Item item) {
    if (item.currentStock <= 0) {
      showMessage('Out of stock');
      return;
    }

    final existingIndex = cart.indexWhere(
      (cartItem) => cartItem.item.id == item.id,
    );

    if (existingIndex != -1) {
      final existing = cart[existingIndex];

      if (existing.quantity >= item.currentStock) {
        showMessage('Insufficient stock');
        return;
      }

      setState(() {
        existing.quantity++;
      });

      return;
    }

    setState(() {
      cart.add(
        CartItem(
          item: item,
          quantity: 1,
        ),
      );
    });
  }

  void increaseQuantity(int index) {
    if (index < 0 || index >= cart.length) {
      return;
    }

    final cartItem = cart[index];

    if (cartItem.quantity >=
        cartItem.item.currentStock) {
      showMessage('Insufficient stock');
      return;
    }

    setState(() {
      cartItem.quantity++;
    });
  }

  void decreaseQuantity(int index) {
    if (index < 0 || index >= cart.length) {
      return;
    }

    final cartItem = cart[index];

    if (cartItem.quantity <= 1) {
      setState(() {
        cart.removeAt(index);
      });

      return;
    }

    setState(() {
      cartItem.quantity--;
    });
  }

  void clearCart() {
    if (cart.isEmpty) return;

    setState(() {
      cart.clear();
    });
  }

  // ==========================================================
  // TOTALS
  // ==========================================================

  double get subtotal {
    return cart.fold(
      0,
      (sum, cartItem) => sum + cartItem.total,
    );
  }

  double get tax {
    return cart.fold(
      0,
      (sum, cartItem) {
        final itemTax =
            cartItem.total *
            cartItem.item.taxRate /
            100;

        return sum + itemTax;
      },
    );
  }

  double get grandTotal {
    return subtotal + tax;
  }

  // ==========================================================
  // PAYMENT
  // ==========================================================

  Future<void> openPaymentScreen() async {
    if (cart.isEmpty) {
      showMessage('Cart is empty');
      return;
    }

    FocusScope.of(context).unfocus();

    final paymentResult = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentPage(
          amountDue: grandTotal,
          cartItems: cart.map((cartItem) {
            return {
              'item_id': cartItem.item.id,
              'name': cartItem.item.name,
              'quantity': cartItem.quantity,
              'unit_price':
                  cartItem.item.sellingPrice,
              'tax_rate':
                  cartItem.item.taxRate,
            };
          }).toList(),
        ),
      ),
    );

    if (!mounted) return;

    if (paymentResult != null) {
      debugPrint(
        'Payment Result: $paymentResult',
      );

      showMessage(
        'Payment information received',
      );
    }
  }

  // ==========================================================
  // MESSAGE
  // ==========================================================

  void showMessage(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
        ),
      );
  }

  // ==========================================================
  // DISPOSE
  // ==========================================================

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  // ==========================================================
  // BUILD
  // ==========================================================

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: const Color(0xFF080F1C),

      // ======================================================
      // APP BAR
      // ======================================================

      appBar: AppBar(
        backgroundColor: const Color(0xFF0D1728),

        title: const Text(
          'New Sale',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),

        actions: [
          IconButton(
            tooltip: 'Sales History',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      const SalesHistoryPage(),
                ),
              );
            },
            icon: const Icon(
              Icons.receipt_long_outlined,
            ),
          ),

          IconButton(
            tooltip: 'Refresh',
            onPressed:
                isLoading ? null : loadItems,
            icon: const Icon(
              Icons.refresh_rounded,
            ),
          ),

          const SizedBox(width: 6),
        ],
      ),

      // ======================================================
      // BODY
      // ======================================================

      body: Column(
        children: [
          // ==================================================
          // SEARCH AREA
          // ==================================================

          Container(
            color: const Color(0xFF0D1728),
            padding: const EdgeInsets.fromLTRB(
              16,
              8,
              16,
              16,
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: searchController,
                        textInputAction:
                            TextInputAction.search,
                        onSubmitted: (_) =>
                            searchItems(),
                        decoration: const InputDecoration(
                          hintText:
                              'Search name, SKU or barcode',
                          prefixIcon: Icon(
                            Icons.search_rounded,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(width: 10),

                    Container(
                      height: 54,
                      width: 54,
                      decoration: BoxDecoration(
                        color: colorScheme.primary,
                        borderRadius:
                            BorderRadius.circular(14),
                      ),
                      child: IconButton(
                        tooltip: 'Search',
                        onPressed: searchItems,
                        icon: const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: scanBarcode,
                    icon: const Icon(
                      Icons.qr_code_scanner_rounded,
                    ),
                    label: const Text(
                      'SCAN BARCODE',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor:
                          colorScheme.primary,
                      side: BorderSide(
                        color: colorScheme.primary
                            .withOpacity(0.55),
                      ),
                      backgroundColor:
                          colorScheme.primary
                              .withOpacity(0.06),
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ==================================================
          // ITEMS
          // ==================================================

          Expanded(
            child: _buildItemsArea(
              colorScheme,
            ),
          ),

          // ==================================================
          // CART
          // ==================================================

          if (cart.isNotEmpty)
            _buildCartSection(
              colorScheme,
            ),
        ],
      ),
    );
  }

  // ==========================================================
  // ITEMS AREA
  // ==========================================================

  Widget _buildItemsArea(
    ColorScheme colorScheme,
  ) {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 14),
            Text(
              'Loading products...',
              style: TextStyle(
                color: Color(0xFF8996A9),
              ),
            ),
          ],
        ),
      );
    }

    if (errorMessage.isNotEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFF15131A),
              borderRadius:
                  BorderRadius.circular(18),
              border: Border.all(
                color: colorScheme.error
                    .withOpacity(0.35),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.cloud_off_rounded,
                  size: 52,
                  color: colorScheme.error,
                ),

                const SizedBox(height: 14),

                const Text(
                  'Unable to load products',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  errorMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF9AA6B8),
                  ),
                ),

                const SizedBox(height: 18),

                FilledButton.icon(
                  onPressed: loadItems,
                  icon: const Icon(
                    Icons.refresh_rounded,
                  ),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 74,
                height: 74,
                decoration: BoxDecoration(
                  color: colorScheme.primary
                      .withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.inventory_2_outlined,
                  size: 38,
                  color: colorScheme.primary,
                ),
              ),

              const SizedBox(height: 16),

              const Text(
                'No products found',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 7),

              const Text(
                'No items were returned from the backend.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF8996A9),
                ),
              ),

              const SizedBox(height: 18),

              OutlinedButton.icon(
                onPressed: loadItems,
                icon: const Icon(
                  Icons.refresh_rounded,
                ),
                label: const Text('Refresh'),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            16,
            14,
            16,
            4,
          ),
          child: Row(
            children: [
              const Text(
                'Products',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),

              const SizedBox(width: 8),

              Container(
                padding:
                    const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: colorScheme.primary
                      .withOpacity(0.12),
                  borderRadius:
                      BorderRadius.circular(20),
                ),
                child: Text(
                  '${items.length}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.primary,
                  ),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(
              12,
              8,
              12,
              16,
            ),
            itemCount: items.length,
            itemBuilder: (
              context,
              index,
            ) {
              final item = items[index];

              return _buildProductCard(
                item,
                colorScheme,
              );
            },
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // PRODUCT CARD
  // ==========================================================

  Widget _buildProductCard(
    Item item,
    ColorScheme colorScheme,
  ) {
    final bool isOutOfStock =
        item.currentStock <= 0;

    final bool isLowStock =
        item.currentStock > 0 &&
        item.currentStock <= 5;

    return Container(
      margin: const EdgeInsets.only(
        bottom: 10,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFF111C2E),
        borderRadius:
            BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF223047),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(13),
        child: Row(
          children: [
            // ================================================
            // PRODUCT ICON
            // ================================================

            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: colorScheme.primary
                    .withOpacity(0.10),
                borderRadius:
                    BorderRadius.circular(14),
              ),
              child: Center(
                child: Text(
                  item.name.isNotEmpty
                      ? item.name[0]
                          .toUpperCase()
                      : '?',
                  style: TextStyle(
                    color: colorScheme.primary,
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),

            const SizedBox(width: 12),

            // ================================================
            // PRODUCT DETAILS
            // ================================================

            Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    maxLines: 1,
                    overflow:
                        TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 5),

                  Text(
                    'SKU: ${item.sku}',
                    maxLines: 1,
                    overflow:
                        TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF7D899C),
                    ),
                  ),

                  const SizedBox(height: 3),

                  Text(
                    'Barcode: ${item.barcode}',
                    maxLines: 1,
                    overflow:
                        TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF7D899C),
                    ),
                  ),

                  const SizedBox(height: 5),

                  Row(
                    children: [
                      Icon(
                        isOutOfStock
                            ? Icons.cancel_outlined
                            : isLowStock
                                ? Icons
                                    .warning_amber_rounded
                                : Icons
                                    .check_circle_outline,
                        size: 14,
                        color: isOutOfStock
                            ? colorScheme.error
                            : isLowStock
                                ? const Color(
                                    0xFFF59E0B,
                                  )
                                : const Color(
                                    0xFF22C55E,
                                  ),
                      ),

                      const SizedBox(width: 5),

                      Text(
                        'Stock: ${item.currentStock}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight:
                              FontWeight.w600,
                          color: isOutOfStock
                              ? colorScheme.error
                              : isLowStock
                                  ? const Color(
                                      0xFFF59E0B,
                                    )
                                  : const Color(
                                      0xFF22C55E,
                                    ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // ================================================
            // PRICE + ADD
            // ================================================

            Column(
              crossAxisAlignment:
                  CrossAxisAlignment.end,
              children: [
                Text(
                  'Rs. ${item.sellingPrice.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: colorScheme.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 8),

                SizedBox(
                  height: 34,
                  child: FilledButton(
                    onPressed: isOutOfStock
                        ? null
                        : () => addToCart(item),
                    style: FilledButton.styleFrom(
                      padding:
                          const EdgeInsets.symmetric(
                        horizontal: 15,
                      ),
                      shape:
                          RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(9),
                      ),
                    ),
                    child: const Text(
                      'ADD',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // CART
  // ==========================================================

  Widget _buildCartSection(
    ColorScheme colorScheme,
  ) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF101827),
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
        border: Border(
          top: BorderSide(
            color: Color(0xFF263247),
          ),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(
        16,
        14,
        16,
        16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ================================================
          // CART HEADER
          // ================================================

          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: colorScheme.primary
                      .withOpacity(0.10),
                  borderRadius:
                      BorderRadius.circular(11),
                ),
                child: Icon(
                  Icons.shopping_cart_outlined,
                  size: 20,
                  color: colorScheme.primary,
                ),
              ),

              const SizedBox(width: 10),

              Expanded(
                child: Text(
                  'Cart (${cart.length})',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              TextButton(
                onPressed: clearCart,
                style: TextButton.styleFrom(
                  foregroundColor:
                      colorScheme.error,
                ),
                child: const Text(
                  'Clear',
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          // ================================================
          // CART ITEMS
          // ================================================

          ConstrainedBox(
            constraints: const BoxConstraints(
              maxHeight: 170,
            ),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: cart.length,
              separatorBuilder: (
                _,
                __,
              ) =>
                  const Divider(
                height: 1,
              ),
              itemBuilder: (
                context,
                index,
              ) {
                final cartItem = cart[index];

                return Padding(
                  padding:
                      const EdgeInsets.symmetric(
                    vertical: 4,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          cartItem.item.name,
                          maxLines: 1,
                          overflow:
                              TextOverflow.ellipsis,
                          style:
                              const TextStyle(
                            color: Colors.white,
                            fontWeight:
                                FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),

                      IconButton(
                        visualDensity:
                            VisualDensity.compact,
                        onPressed: () =>
                            decreaseQuantity(
                          index,
                        ),
                        icon: const Icon(
                          Icons
                              .remove_circle_outline,
                          size: 19,
                        ),
                      ),

                      Text(
                        '${cartItem.quantity}',
                        style:
                            const TextStyle(
                          color: Colors.white,
                          fontWeight:
                              FontWeight.bold,
                        ),
                      ),

                      IconButton(
                        visualDensity:
                            VisualDensity.compact,
                        onPressed: () =>
                            increaseQuantity(
                          index,
                        ),
                        icon: Icon(
                          Icons
                              .add_circle_outline,
                          size: 19,
                          color:
                              colorScheme.primary,
                        ),
                      ),

                      SizedBox(
                        width: 82,
                        child: Text(
                          'Rs. ${cartItem.total.toStringAsFixed(0)}',
                          textAlign:
                              TextAlign.right,
                          style:
                              const TextStyle(
                            color: Colors.white,
                            fontWeight:
                                FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 8),

          const Divider(),

          const SizedBox(height: 5),

          // ================================================
          // SUBTOTAL
          // ================================================

          _summaryRow(
            'Subtotal',
            subtotal,
            colorScheme,
          ),

          const SizedBox(height: 5),

          // ================================================
          // TAX
          // ================================================

          _summaryRow(
            'Tax',
            tax,
            colorScheme,
          ),

          const SizedBox(height: 8),

          // ================================================
          // TOTAL
          // ================================================

          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),

              Text(
                'Rs. ${grandTotal.toStringAsFixed(2)}',
                style: TextStyle(
                  color: colorScheme.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // ================================================
          // PAYMENT BUTTON
          // ================================================

          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton.icon(
              onPressed: openPaymentScreen,
              icon: const Icon(
                Icons.payment_rounded,
              ),
              label: const Text(
                'PROCEED TO PAYMENT',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.4,
                ),
              ),
              style: FilledButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius:
                      BorderRadius.circular(14),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // SUMMARY ROW
  // ==========================================================

  Widget _summaryRow(
    String title,
    double amount,
    ColorScheme colorScheme,
  ) {
    return Row(
      mainAxisAlignment:
          MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF8996A9),
            fontSize: 13,
          ),
        ),
        Text(
          'Rs. ${amount.toStringAsFixed(2)}',
          style: const TextStyle(
            color: Color(0xFFB9C3D1),
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}