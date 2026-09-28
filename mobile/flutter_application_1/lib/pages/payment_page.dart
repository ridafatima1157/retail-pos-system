import 'package:flutter/material.dart';

import '../services/sale_service.dart';
import 'receipt_page.dart';

class PaymentPage extends StatefulWidget {
  final double amountDue;
  final List<Map<String, dynamic>> cartItems;

  const PaymentPage({
    super.key,
    required this.amountDue,
    required this.cartItems,
  });

  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  final SaleService saleService = SaleService();

  String paymentMethod = 'CASH';

  final TextEditingController cashController =
      TextEditingController();

  final TextEditingController splitCashController =
      TextEditingController();

  double cashAmount = 0;
  double splitCashAmount = 0;
  double change = 0;

  bool cardConfirmed = false;
  bool splitCardConfirmed = false;

  bool isProcessing = false;

  // ==========================================================
  // COLORS - SAME AS MAIN.DART
  // ==========================================================

  static const Color backgroundColor = Color(0xFF080F1C);
  static const Color surfaceColor = Color(0xFF101827);
  static const Color cardColor = Color(0xFF151F31);
  static const Color primaryColor = Color(0xFF14B8A6);
  static const Color borderColor = Color(0xFF263247);
  static const Color mutedTextColor = Color(0xFF8996A9);
  static const Color secondaryTextColor = Color(0xFFB9C3D1);
  static const Color errorColor = Color(0xFFEF4444);

  // ==========================================================
  // CASH CALCULATION
  // ==========================================================

  void calculateCash() {
    final value =
        double.tryParse(cashController.text.trim()) ?? 0;

    setState(() {
      cashAmount = value;

      change = value - widget.amountDue;

      if (change < 0) {
        change = 0;
      }
    });
  }

  // ==========================================================
  // SPLIT CASH CALCULATION
  // ==========================================================

  void calculateSplitCash() {
    final value =
        double.tryParse(splitCashController.text.trim()) ?? 0;

    setState(() {
      splitCashAmount = value;
      splitCardConfirmed = false;
    });
  }

  // ==========================================================
  // SPLIT CARD AMOUNT
  // ==========================================================

  double get splitCardAmount {
    final cardAmount =
        widget.amountDue - splitCashAmount;

    if (cardAmount < 0) {
      return 0;
    }

    return cardAmount;
  }

  // ==========================================================
  // SPLIT PAYMENT VALIDATION
  // ==========================================================

  bool get splitPaymentValid {
    if (splitCashAmount <= 0) {
      return false;
    }

    if (splitCashAmount >= widget.amountDue) {
      return false;
    }

    final cardAmount =
        widget.amountDue - splitCashAmount;

    return cardAmount > 0 && splitCardConfirmed;
  }

  // ==========================================================
  // PAYMENT METHOD SELECTION
  // ==========================================================

  void selectPaymentMethod(String method) {
    setState(() {
      paymentMethod = method;

      if (method != 'CASH') {
        cashController.clear();
        cashAmount = 0;
        change = 0;
      }

      if (method != 'SPLIT') {
        splitCashController.clear();
        splitCashAmount = 0;
        splitCardConfirmed = false;
      }

      if (method != 'CARD') {
        cardConfirmed = false;
      }
    });
  }

  // ==========================================================
  // CARD CONFIRMATION
  // ==========================================================

  void confirmCardPayment() {
    setState(() {
      cardConfirmed = true;
    });

    showMessage(
      'Card payment confirmed successfully.',
      isSuccess: true,
    );
  }

  // ==========================================================
  // SPLIT CARD CONFIRMATION
  // ==========================================================

  void confirmSplitCardPayment() {
    if (splitCashAmount <= 0 ||
        splitCashAmount >= widget.amountDue) {
      showMessage(
        'Enter a valid cash amount first.',
        isSuccess: false,
      );

      return;
    }

    setState(() {
      splitCardConfirmed = true;
    });

    showMessage(
      'Card payment of Rs. '
      '${splitCardAmount.toStringAsFixed(2)} confirmed.',
      isSuccess: true,
    );
  }

  // ==========================================================
  // SNACKBAR
  // ==========================================================

  void showMessage(
    String message, {
    required bool isSuccess,
  }) {
    if (!mounted) return;

    final colorScheme = Theme.of(context).colorScheme;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          backgroundColor: isSuccess
              ? primaryColor
              : errorColor,
          content: Row(
            children: [
              Icon(
                isSuccess
                    ? Icons.check_circle_outline
                    : Icons.info_outline,
                color: Colors.white,
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
  }

  // ==========================================================
  // CAN COMPLETE SALE
  // ==========================================================

  bool get canCompleteSale {
    if (paymentMethod == 'CASH') {
      return cashAmount >= widget.amountDue;
    }

    if (paymentMethod == 'CARD') {
      return cardConfirmed;
    }

    if (paymentMethod == 'SPLIT') {
      return splitPaymentValid;
    }

    return false;
  }

  // ==========================================================
  // COMPLETE SALE
  // ==========================================================

  Future<void> completeSale() async {
    if (isProcessing) {
      return;
    }

    if (!canCompleteSale) {
      showMessage(
        'Please complete the payment first.',
        isSuccess: false,
      );

      return;
    }

    setState(() {
      isProcessing = true;
    });

    try {
      // ------------------------------------------------------
      // BUILD PAYMENT DATA
      // ------------------------------------------------------

      List<Map<String, dynamic>> payments = [];

      if (paymentMethod == 'CASH') {
        payments = [
          {
            'payment_method': 'CASH',
            'amount': cashAmount,
          },
        ];
      }

      if (paymentMethod == 'CARD') {
        payments = [
          {
            'payment_method': 'CARD',
            'amount': widget.amountDue,
          },
        ];
      }

      if (paymentMethod == 'SPLIT') {
        payments = [
          {
            'payment_method': 'CASH',
            'amount': splitCashAmount,
          },
          {
            'payment_method': 'CARD',
            'amount': splitCardAmount,
          },
        ];
      }

      // ------------------------------------------------------
      // BUILD SALE ITEMS
      // ------------------------------------------------------

      final List<Map<String, dynamic>> saleItems =
          widget.cartItems.map((cartItem) {
        return {
          'item_id': cartItem['item_id'],
          'quantity': cartItem['quantity'],
        };
      }).toList();

      // ------------------------------------------------------
      // SEND SALE TO BACKEND
      // ------------------------------------------------------

      final result = await saleService.createSale(
        items: saleItems,
        payments: payments,
        discount: 0,
      );

      if (!mounted) {
        return;
      }

      // ------------------------------------------------------
      // OPEN RECEIPT SCREEN
      // ------------------------------------------------------

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ReceiptPage(
            sale: result,
          ),
        ),
      );
    } catch (e, stackTrace) {
      debugPrint('COMPLETE SALE ERROR: $e');
      debugPrintStack(stackTrace: stackTrace);

      if (!mounted) {
        return;
      }

      setState(() {
        isProcessing = false;
      });

      showMessage(
        e.toString().replaceFirst(
              'Exception: ',
              '',
            ),
        isSuccess: false,
      );
    }
  }

  // ==========================================================
  // DISPOSE
  // ==========================================================

  @override
  void dispose() {
    cashController.dispose();
    splitCashController.dispose();
    super.dispose();
  }

  // ==========================================================
  // BUILD
  // ==========================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,

      appBar: AppBar(
        backgroundColor: surfaceColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleSpacing: 20,

        title: const Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            Text(
              'Payment',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: Colors.white,
                fontSize: 22,
              ),
            ),
            Text(
              'Complete your transaction',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: mutedTextColor,
              ),
            ),
          ],
        ),
      ),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            18,
            18,
            18,
            28,
          ),
          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [
              // ==================================================
              // AMOUNT DUE
              // ==================================================

              _buildAmountCard(),

              const SizedBox(height: 28),

              const Text(
                'Payment Method',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 5),

              const Text(
                'Select how the customer wants to pay',
                style: TextStyle(
                  fontSize: 13,
                  color: mutedTextColor,
                ),
              ),

              const SizedBox(height: 14),

              // ==================================================
              // PAYMENT METHOD BUTTONS
              // ==================================================

              Row(
                children: [
                  Expanded(
                    child: _paymentButton(
                      title: 'Cash',
                      icon:
                          Icons.payments_outlined,
                      value: 'CASH',
                    ),
                  ),

                  const SizedBox(width: 9),

                  Expanded(
                    child: _paymentButton(
                      title: 'Card',
                      icon:
                          Icons.credit_card_outlined,
                      value: 'CARD',
                    ),
                  ),

                  const SizedBox(width: 9),

                  Expanded(
                    child: _paymentButton(
                      title: 'Split',
                      icon:
                          Icons.call_split_rounded,
                      value: 'SPLIT',
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 22),

              // ==================================================
              // PAYMENT SECTIONS
              // ==================================================

              AnimatedSwitcher(
                duration:
                    const Duration(milliseconds: 250),
                child: paymentMethod == 'CASH'
                    ? _buildCashSection()
                    : paymentMethod == 'CARD'
                        ? _buildCardSection()
                        : _buildSplitSection(),
              ),

              const SizedBox(height: 26),

              // ==================================================
              // COMPLETE SALE BUTTON
              // ==================================================

              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton.icon(
                  onPressed:
                      canCompleteSale &&
                              !isProcessing
                          ? completeSale
                          : null,

                  style: FilledButton.styleFrom(
                    backgroundColor:
                        primaryColor,

                    foregroundColor:
                        Colors.white,

                    disabledBackgroundColor:
                        cardColor,

                    disabledForegroundColor:
                        mutedTextColor,

                    shape:
                        RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(14),
                    ),
                  ),

                  icon: isProcessing
                      ? const SizedBox(
                          width: 21,
                          height: 21,
                          child:
                              CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(
                          Icons
                              .check_circle_outline,
                          size: 23,
                        ),

                  label: Text(
                    isProcessing
                        ? 'Processing...'
                        : 'Complete Sale',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              const Center(
                child: Row(
                  mainAxisAlignment:
                      MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.lock_outline_rounded,
                      size: 14,
                      color: mutedTextColor,
                    ),
                    SizedBox(width: 5),
                    Text(
                      'Secure transaction',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: mutedTextColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // AMOUNT CARD
  // ==========================================================

  Widget _buildAmountCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),

      decoration: BoxDecoration(
        color: surfaceColor,

        borderRadius:
            BorderRadius.circular(22),

        border: Border.all(
          color: primaryColor.withOpacity(0.35),
        ),

        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.22),
            blurRadius: 18,
            offset: const Offset(0, 7),
          ),
        ],
      ),

      child: Column(
        children: [
          Row(
            mainAxisAlignment:
                MainAxisAlignment.center,
            children: [
              Container(
                padding:
                    const EdgeInsets.all(8),

                decoration: BoxDecoration(
                  color: primaryColor
                      .withOpacity(0.12),
                  borderRadius:
                      BorderRadius.circular(10),
                ),

                child: const Icon(
                  Icons.receipt_long_rounded,
                  size: 19,
                  color: primaryColor,
                ),
              ),

              const SizedBox(width: 9),

              const Text(
                'AMOUNT DUE',
                style: TextStyle(
                  color: secondaryTextColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          Text(
            'Rs. ${widget.amountDue.toStringAsFixed(2)}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.8,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // PAYMENT METHOD BUTTON
  // ==========================================================

  Widget _paymentButton({
    required String title,
    required IconData icon,
    required String value,
  }) {
    final selected =
        paymentMethod == value;

    return Material(
      color: Colors.transparent,

      child: InkWell(
        onTap: isProcessing
            ? null
            : () =>
                selectPaymentMethod(value),

        borderRadius:
            BorderRadius.circular(16),

        child: AnimatedContainer(
          duration:
              const Duration(milliseconds: 220),

          height: 94,

          decoration: BoxDecoration(
            color: selected
                ? primaryColor.withOpacity(0.12)
                : cardColor,

            borderRadius:
                BorderRadius.circular(16),

            border: Border.all(
              color: selected
                  ? primaryColor
                  : borderColor,

              width: selected ? 1.6 : 1,
            ),

            boxShadow: selected
                ? [
                    BoxShadow(
                      color: primaryColor
                          .withOpacity(0.08),
                      blurRadius: 12,
                      offset:
                          const Offset(0, 4),
                    ),
                  ]
                : null,
          ),

          child: Stack(
            children: [
              Center(
                child: Column(
                  mainAxisAlignment:
                      MainAxisAlignment.center,
                  children: [
                    Icon(
                      icon,
                      size: 27,
                      color: selected
                          ? primaryColor
                          : mutedTextColor,
                    ),

                    const SizedBox(height: 7),

                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: selected
                            ? FontWeight.w800
                            : FontWeight.w600,
                        fontSize: 13,
                        color: selected
                            ? primaryColor
                            : secondaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),

              if (selected)
                const Positioned(
                  top: 7,
                  right: 7,
                  child: Icon(
                    Icons.check_circle_rounded,
                    size: 17,
                    color: primaryColor,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // CASH SECTION
  // ==========================================================

  Widget _buildCashSection() {
    return _sectionCard(
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            icon:
                Icons.payments_outlined,
            title: 'Cash Payment',
            subtitle:
                'Enter the amount received from customer',
          ),

          const SizedBox(height: 20),

          TextField(
            controller:
                cashController,

            keyboardType:
                const TextInputType.numberWithOptions(
              decimal: true,
            ),

            onChanged:
                (_) => calculateCash(),

            decoration: _inputDecoration(
              label: 'Cash Tendered',
              hint: 'Enter amount',
              icon:
                  Icons.payments_outlined,
            ),
          ),

          const SizedBox(height: 20),

          _summaryRow(
            'Amount Due',
            widget.amountDue,
          ),

          const SizedBox(height: 12),

          const Divider(
            color: borderColor,
          ),

          const SizedBox(height: 12),

          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Change',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),

              Container(
                padding:
                    const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 7,
                ),

                decoration: BoxDecoration(
                  color: change > 0
                      ? primaryColor
                          .withOpacity(0.12)
                      : cardColor,

                  borderRadius:
                      BorderRadius.circular(10),

                  border: Border.all(
                    color: change > 0
                        ? primaryColor
                            .withOpacity(0.20)
                        : borderColor,
                  ),
                ),

                child: Text(
                  'Rs. ${change.toStringAsFixed(2)}',

                  style: TextStyle(
                    fontSize: 17,
                    fontWeight:
                        FontWeight.w900,

                    color: change > 0
                        ? primaryColor
                        : secondaryTextColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // CARD SECTION
  // ==========================================================

  Widget _buildCardSection() {
    return _sectionCard(
      child: Column(
        children: [
          Container(
            padding:
                const EdgeInsets.all(18),

            decoration: BoxDecoration(
              color:
                  primaryColor.withOpacity(0.12),
              shape: BoxShape.circle,
              border: Border.all(
                color:
                    primaryColor.withOpacity(0.20),
              ),
            ),

            child: const Icon(
              Icons.credit_card_rounded,
              size: 42,
              color: primaryColor,
            ),
          ),

          const SizedBox(height: 16),

          const Text(
            'Card Payment',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),

          const SizedBox(height: 5),

          const Text(
            'Customer will pay the full amount by card',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: mutedTextColor,
            ),
          ),

          const SizedBox(height: 12),

          Text(
            'Rs. ${widget.amountDue.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 27,
              fontWeight: FontWeight.w900,
              color: primaryColor,
            ),
          ),

          const SizedBox(height: 22),

          if (!cardConfirmed)
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton.tonalIcon(
                onPressed: isProcessing
                    ? null
                    : confirmCardPayment,

                icon: const Icon(
                  Icons.check_rounded,
                  color: primaryColor,
                ),

                label: const Text(
                  'Confirm Card Payment',
                  style: TextStyle(
                    fontWeight:
                        FontWeight.w800,
                    color: primaryColor,
                  ),
                ),

                style:
                    FilledButton.styleFrom(
                  backgroundColor:
                      primaryColor
                          .withOpacity(0.12),

                  shape:
                      RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(13),
                    side: BorderSide(
                      color: primaryColor
                          .withOpacity(0.20),
                    ),
                  ),
                ),
              ),
            ),

          if (cardConfirmed)
            _successBox(
              icon:
                  Icons.check_circle_rounded,
              title:
                  'Payment Successful',
              subtitle:
                  'Card payment has been confirmed.',
            ),
        ],
      ),
    );
  }

  // ==========================================================
  // SPLIT SECTION
  // ==========================================================

  Widget _buildSplitSection() {
    final cardAmount =
        splitCardAmount;

    return _sectionCard(
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            icon:
                Icons.call_split_rounded,
            title: 'Split Payment',
            subtitle:
                'Pay part by cash and the rest by card',
          ),

          const SizedBox(height: 20),

          TextField(
            controller:
                splitCashController,

            keyboardType:
                const TextInputType.numberWithOptions(
              decimal: true,
            ),

            onChanged:
                (_) => calculateSplitCash(),

            decoration: _inputDecoration(
              label: 'Cash Amount',
              hint: 'Enter cash amount',
              icon:
                  Icons.payments_outlined,
            ),
          ),

          const SizedBox(height: 20),

          _summaryRow(
            'Amount Due',
            widget.amountDue,
          ),

          const SizedBox(height: 10),

          _summaryRow(
            'Cash',
            splitCashAmount,
          ),

          const SizedBox(height: 10),

          _summaryRow(
            'Card',
            cardAmount,
          ),

          const SizedBox(height: 18),

          if (splitCashAmount > 0 &&
              splitCashAmount <
                  widget.amountDue &&
              !splitCardConfirmed)
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton.tonalIcon(
                onPressed: isProcessing
                    ? null
                    : confirmSplitCardPayment,

                icon: const Icon(
                  Icons.credit_card_rounded,
                  color: primaryColor,
                ),

                label: Text(
                  'Confirm Card Rs. '
                  '${cardAmount.toStringAsFixed(2)}',

                  style:
                      const TextStyle(
                    fontWeight:
                        FontWeight.w800,
                    color: primaryColor,
                  ),
                ),

                style:
                    FilledButton.styleFrom(
                  backgroundColor:
                      primaryColor
                          .withOpacity(0.12),

                  shape:
                      RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(13),
                    side: BorderSide(
                      color: primaryColor
                          .withOpacity(0.20),
                    ),
                  ),
                ),
              ),
            ),

          if (splitCardConfirmed) ...[
            const SizedBox(height: 4),

            _successBox(
              icon:
                  Icons.check_circle_rounded,
              title:
                  'Card Payment Confirmed',
              subtitle:
                  'Rs. ${cardAmount.toStringAsFixed(2)} paid by card.',
            ),

            const SizedBox(height: 12),
          ],

          const SizedBox(height: 4),

          Container(
            width: double.infinity,
            padding:
                const EdgeInsets.all(14),

            decoration: BoxDecoration(
              color: splitPaymentValid
                  ? primaryColor
                      .withOpacity(0.10)
                  : const Color(0xFF2A2415),

              borderRadius:
                  BorderRadius.circular(13),

              border: Border.all(
                color: splitPaymentValid
                    ? primaryColor
                        .withOpacity(0.20)
                    : const Color(0xFF5A4A20),
              ),
            ),

            child: Row(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Icon(
                  splitPaymentValid
                      ? Icons
                          .check_circle_outline
                      : Icons.info_outline,

                  size: 20,

                  color: splitPaymentValid
                      ? primaryColor
                      : const Color(0xFFF59E0B),
                ),

                const SizedBox(width: 9),

                Expanded(
                  child: Text(
                    splitPaymentValid
                        ? 'Cash + Card = Rs. '
                            '${widget.amountDue.toStringAsFixed(2)}'
                        : 'Enter cash amount and confirm the remaining card payment.',

                    style: TextStyle(
                      color: splitPaymentValid
                          ? const Color(
                              0xFF8DE1D7,
                            )
                          : const Color(
                              0xFFF6C453,
                            ),

                      fontWeight:
                          FontWeight.w700,

                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // SECTION CARD
  // ==========================================================

  Widget _sectionCard({
    required Widget child,
  }) {
    return Container(
      width: double.infinity,

      padding:
          const EdgeInsets.all(20),

      decoration: BoxDecoration(
        color: surfaceColor,

        borderRadius:
            BorderRadius.circular(20),

        border: Border.all(
          color: borderColor,
        ),

        boxShadow: [
          BoxShadow(
            color:
                Colors.black.withOpacity(0.18),
            blurRadius: 14,
            offset:
                const Offset(0, 5),
          ),
        ],
      ),

      child: child,
    );
  }

  // ==========================================================
  // SECTION HEADER
  // ==========================================================

  Widget _sectionHeader({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      crossAxisAlignment:
          CrossAxisAlignment.start,
      children: [
        Container(
          padding:
              const EdgeInsets.all(10),

          decoration: BoxDecoration(
            color:
                primaryColor.withOpacity(0.12),

            borderRadius:
                BorderRadius.circular(12),

            border: Border.all(
              color:
                  primaryColor.withOpacity(0.18),
            ),
          ),

          child: Icon(
            icon,
            size: 22,
            color: primaryColor,
          ),
        ),

        const SizedBox(width: 12),

        Expanded(
          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight:
                      FontWeight.w800,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 3),

              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 12,
                  color: mutedTextColor,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // INPUT DECORATION
  // ==========================================================

  InputDecoration _inputDecoration({
    required String label,
    required String hint,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,

      prefixIcon: Icon(
        icon,
        color: primaryColor,
      ),

      prefixText: 'Rs. ',

      filled: true,

      fillColor: cardColor,

      hintStyle: const TextStyle(
        color: mutedTextColor,
      ),

      labelStyle: const TextStyle(
        color: secondaryTextColor,
      ),

      contentPadding:
          const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 15,
      ),

      border: OutlineInputBorder(
        borderRadius:
            BorderRadius.circular(14),
        borderSide:
            BorderSide.none,
      ),

      enabledBorder:
          OutlineInputBorder(
        borderRadius:
            BorderRadius.circular(14),
        borderSide:
            const BorderSide(
          color: borderColor,
        ),
      ),

      focusedBorder:
          OutlineInputBorder(
        borderRadius:
            BorderRadius.circular(14),
        borderSide:
            const BorderSide(
          color: primaryColor,
          width: 1.5,
        ),
      ),
    );
  }

  // ==========================================================
  // SUCCESS BOX
  // ==========================================================

  Widget _successBox({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      width: double.infinity,

      padding:
          const EdgeInsets.all(14),

      decoration: BoxDecoration(
        color:
            primaryColor.withOpacity(0.10),

        borderRadius:
            BorderRadius.circular(14),

        border: Border.all(
          color:
              primaryColor.withOpacity(0.20),
        ),
      ),

      child: Row(
        children: [
          const Icon(
            Icons.check_circle_rounded,
            color: primaryColor,
            size: 25,
          ),

          const SizedBox(width: 10),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: primaryColor,
                    fontWeight:
                        FontWeight.w800,
                    fontSize: 14,
                  ),
                ),

                const SizedBox(height: 2),

                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFFB9C3D1),
                    fontSize: 12,
                  ),
                ),
              ],
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
  ) {
    return Row(
      mainAxisAlignment:
          MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            color: mutedTextColor,
          ),
        ),

        Text(
          'Rs. ${amount.toStringAsFixed(2)}',
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 14,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
}