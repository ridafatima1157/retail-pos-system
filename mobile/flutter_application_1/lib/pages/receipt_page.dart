import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'dart:typed_data';
class ReceiptPage extends StatelessWidget {
  final Map<String, dynamic> sale;

  const ReceiptPage({
    super.key,
    required this.sale,
  });

  // ==========================================================
  // HELPERS
  // ==========================================================

  double _number(dynamic value) {
    return double.tryParse(value.toString()) ?? 0;
  }

  String _money(dynamic value) {
    return 'Rs. ${_number(value).toStringAsFixed(2)}';
  }

  String _formatDate(dynamic value) {
    if (value == null) {
      return DateFormat(
        'dd MMM yyyy, hh:mm a',
      ).format(DateTime.now());
    }

    try {
      final date =
          DateTime.parse(value.toString()).toLocal();

      return DateFormat(
        'dd MMM yyyy, hh:mm a',
      ).format(date);
    } catch (_) {
      return value.toString();
    }
  }

  // ==========================================================
  // PDF GENERATION
  // ==========================================================

  Future<Uint8List> _generatePdf(
    PdfPageFormat format,
  ) async {
    final invoice =
        sale['invoice_number'] ??
            sale['invoice'] ??
            'N/A';

    final subtotal =
        sale['subtotal'] ?? 0;

    final discount =
        sale['discount'] ?? 0;

    final tax =
        sale['tax'] ?? 0;

    final grandTotal =
        sale['grand_total'] ??
            sale['total'] ??
            0;

    final cashier =
        sale['cashier_name'] ??
            sale['cashier'] ??
            'Cashier';

    final createdAt =
        sale['created_at'] ??
            sale['date'];

    final payments =
        sale['payments'] is List
            ? List<Map<String, dynamic>>.from(
                sale['payments'].map(
                  (payment) =>
                      Map<String, dynamic>.from(
                    payment,
                  ),
                ),
              )
            : <Map<String, dynamic>>[];

    final items =
        sale['items'] is List
            ? List<Map<String, dynamic>>.from(
                sale['items'].map(
                  (item) =>
                      Map<String, dynamic>.from(
                    item,
                  ),
                ),
              )
            : <Map<String, dynamic>>[];

    final pdf = pw.Document();

    final primaryColor =
        PdfColor.fromHex('#14B8A6');

    final darkColor =
        PdfColor.fromHex('#111827');

    final grayColor =
        PdfColor.fromHex('#6B7280');

    final lightColor =
        PdfColor.fromHex('#F3F4F6');

    pdf.addPage(
      pw.MultiPage(
        pageFormat: format,
        margin: const pw.EdgeInsets.all(28),

        build: (pw.Context context) {
          return [
            // ==================================================
            // HEADER
            // ==================================================

            pw.Center(
              child: pw.Column(
                children: [
                  pw.Container(
                    width: 52,
                    height: 52,
                    decoration: pw.BoxDecoration(
                      color: primaryColor,
                      borderRadius:
                          pw.BorderRadius.circular(12),
                    ),
                    child: pw.Center(
                      child: pw.Text(
                        '✓',
                        style: pw.TextStyle(
                          color: PdfColors.white,
                          fontSize: 30,
                          fontWeight:
                              pw.FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  pw.SizedBox(height: 10),

                  pw.Text(
                    'RETAIL POS',
                    style: pw.TextStyle(
                      fontSize: 20,
                      fontWeight:
                          pw.FontWeight.bold,
                      color: darkColor,
                      letterSpacing: 1.2,
                    ),
                  ),

                  pw.SizedBox(height: 3),

                  pw.Text(
                    'Sales Receipt',
                    style: pw.TextStyle(
                      fontSize: 10,
                      color: grayColor,
                    ),
                  ),

                  pw.SizedBox(height: 14),

                  pw.Container(
                    padding:
                        const pw.EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: pw.BoxDecoration(
                      color: lightColor,
                      borderRadius:
                          pw.BorderRadius.circular(15),
                    ),
                    child: pw.Text(
                      invoice.toString(),
                      style: pw.TextStyle(
                        fontSize: 10,
                        fontWeight:
                            pw.FontWeight.bold,
                        color: darkColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 22),

            // ==================================================
            // SALE INFORMATION
            // ==================================================

            pw.Container(
              padding:
                  const pw.EdgeInsets.all(14),
              decoration: pw.BoxDecoration(
                color: lightColor,
                borderRadius:
                    pw.BorderRadius.circular(10),
              ),
              child: pw.Column(
                children: [
                  _pdfInfoRow(
                    'Invoice',
                    invoice.toString(),
                    darkColor,
                    grayColor,
                  ),
                  _pdfInfoRow(
                    'Date & Time',
                    _formatDate(createdAt),
                    darkColor,
                    grayColor,
                  ),
                  _pdfInfoRow(
                    'Cashier',
                    cashier.toString(),
                    darkColor,
                    grayColor,
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 22),

            // ==================================================
            // ITEMS TITLE
            // ==================================================

            pw.Text(
              'ITEMS',
              style: pw.TextStyle(
                fontSize: 12,
                fontWeight:
                    pw.FontWeight.bold,
                color: darkColor,
              ),
            ),

            pw.SizedBox(height: 8),

            // ==================================================
            // ITEMS TABLE
            // ==================================================

            if (items.isEmpty)
              pw.Container(
                width: double.infinity,
                padding:
                    const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  color: lightColor,
                  borderRadius:
                      pw.BorderRadius.circular(8),
                ),
                child: pw.Text(
                  'Item details are not available.',
                  style: pw.TextStyle(
                    fontSize: 9,
                    color: grayColor,
                  ),
                ),
              )
            else
              pw.Table(
                border: pw.TableBorder(
                  horizontalInside:
                      pw.BorderSide(
                    color: PdfColors.grey300,
                    width: 0.5,
                  ),
                ),
                columnWidths: const {
                  0: pw.FlexColumnWidth(3.2),
                  1: pw.FlexColumnWidth(1),
                  2: pw.FlexColumnWidth(1.6),
                  3: pw.FlexColumnWidth(1.8),
                },
                children: [
                  pw.TableRow(
                    decoration:
                        pw.BoxDecoration(
                      color: lightColor,
                    ),
                    children: [
                      _pdfTableHeader('Item'),
                      _pdfTableHeader('Qty'),
                      _pdfTableHeader('Price'),
                      _pdfTableHeader('Total'),
                    ],
                  ),

                  ...items.map(
                    (item) {
                      final name =
                          item['name'] ??
                              item['item_name'] ??
                              'Item';

                      final quantity =
                          item['quantity'] ?? 0;

                      final unitPrice =
                          item['unit_price'] ?? 0;

                      final lineTotal =
                          item['line_total'] ??
                              item['total'] ??
                              (_number(unitPrice) *
                                  _number(quantity));

                      return pw.TableRow(
                        children: [
                          _pdfTableCell(
                            name.toString(),
                          ),
                          _pdfTableCell(
                            quantity.toString(),
                            center: true,
                          ),
                          _pdfTableCell(
                            _money(unitPrice),
                            right: true,
                          ),
                          _pdfTableCell(
                            _money(lineTotal),
                            right: true,
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),

            pw.SizedBox(height: 20),

            // ==================================================
            // SUMMARY
            // ==================================================

            pw.Text(
              'SUMMARY',
              style: pw.TextStyle(
                fontSize: 12,
                fontWeight:
                    pw.FontWeight.bold,
                color: darkColor,
              ),
            ),

            pw.SizedBox(height: 8),

            pw.Container(
              padding:
                  const pw.EdgeInsets.all(13),
              decoration: pw.BoxDecoration(
                color: lightColor,
                borderRadius:
                    pw.BorderRadius.circular(10),
              ),
              child: pw.Column(
                children: [
                  _pdfAmountRow(
                    'Subtotal',
                    subtotal,
                    darkColor,
                    grayColor,
                  ),

                  _pdfAmountRow(
                    'Discount',
                    discount,
                    darkColor,
                    grayColor,
                    isDiscount: true,
                  ),

                  _pdfAmountRow(
                    'Tax',
                    tax,
                    darkColor,
                    grayColor,
                  ),

                  pw.SizedBox(height: 8),

                  pw.Container(
                    padding:
                        const pw.EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 10,
                    ),
                    decoration:
                        pw.BoxDecoration(
                      color: PdfColor.fromHex(
                        '#CCFBF1',
                      ),
                      borderRadius:
                          pw.BorderRadius.circular(8),
                    ),
                    child: pw.Row(
                      mainAxisAlignment:
                          pw.MainAxisAlignment
                              .spaceBetween,
                      children: [
                        pw.Text(
                          'Grand Total',
                          style:
                              pw.TextStyle(
                            fontSize: 12,
                            fontWeight:
                                pw.FontWeight.bold,
                            color: darkColor,
                          ),
                        ),
                        pw.Text(
                          _money(grandTotal),
                          style:
                              pw.TextStyle(
                            fontSize: 14,
                            fontWeight:
                                pw.FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 20),

            // ==================================================
            // PAYMENT
            // ==================================================

            pw.Text(
              'PAYMENT',
              style: pw.TextStyle(
                fontSize: 12,
                fontWeight:
                    pw.FontWeight.bold,
                color: darkColor,
              ),
            ),

            pw.SizedBox(height: 8),

            if (payments.isEmpty)
              pw.Container(
                width: double.infinity,
                padding:
                    const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  color: lightColor,
                  borderRadius:
                      pw.BorderRadius.circular(8),
                ),
                child: pw.Text(
                  'Payment information unavailable.',
                  style: pw.TextStyle(
                    fontSize: 9,
                    color: grayColor,
                  ),
                ),
              )
            else
              ...payments.map(
                (payment) {
                  final method =
                      payment[
                              'payment_method'] ??
                          'Unknown';

                  final amount =
                      payment['amount'] ?? 0;

                  return pw.Container(
                    margin:
                        const pw.EdgeInsets.only(
                      bottom: 6,
                    ),
                    padding:
                        const pw.EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration:
                        pw.BoxDecoration(
                      color: lightColor,
                      borderRadius:
                          pw.BorderRadius.circular(8),
                    ),
                    child: pw.Row(
                      mainAxisAlignment:
                          pw.MainAxisAlignment
                              .spaceBetween,
                      children: [
                        pw.Text(
                          method.toString(),
                          style:
                              pw.TextStyle(
                            fontSize: 10,
                            fontWeight:
                                pw.FontWeight.bold,
                            color: darkColor,
                          ),
                        ),
                        pw.Text(
                          _money(amount),
                          style:
                              pw.TextStyle(
                            fontSize: 10,
                            fontWeight:
                                pw.FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),

            pw.SizedBox(height: 25),

            pw.Divider(
              color: PdfColors.grey300,
            ),

            pw.SizedBox(height: 12),

            // ==================================================
            // THANK YOU
            // ==================================================

            pw.Center(
              child: pw.Column(
                children: [
                  pw.Text(
                    'Thank you for your purchase!',
                    style: pw.TextStyle(
                      fontSize: 11,
                      fontWeight:
                          pw.FontWeight.bold,
                      color: darkColor,
                    ),
                  ),

                  pw.SizedBox(height: 4),

                  pw.Text(
                    'Please visit us again.',
                    style: pw.TextStyle(
                      fontSize: 9,
                      color: grayColor,
                    ),
                  ),
                ],
              ),
            ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  // ==========================================================
  // PDF INFO ROW
  // ==========================================================

  pw.Widget _pdfInfoRow(
    String title,
    String value,
    PdfColor darkColor,
    PdfColor grayColor,
  ) {
    return pw.Padding(
      padding:
          const pw.EdgeInsets.symmetric(
        vertical: 3,
      ),
      child: pw.Row(
        children: [
          pw.SizedBox(
            width: 75,
            child: pw.Text(
              title,
              style: pw.TextStyle(
                fontSize: 9,
                color: grayColor,
              ),
            ),
          ),
          pw.SizedBox(width: 8),
          pw.Expanded(
            child: pw.Text(
              value,
              textAlign:
                  pw.TextAlign.right,
              style: pw.TextStyle(
                fontSize: 9,
                fontWeight:
                    pw.FontWeight.bold,
                color: darkColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // PDF TABLE HEADER
  // ==========================================================

  pw.Widget _pdfTableHeader(
    String text,
  ) {
    return pw.Padding(
      padding:
          const pw.EdgeInsets.symmetric(
        horizontal: 5,
        vertical: 7,
      ),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 8,
          fontWeight:
              pw.FontWeight.bold,
          color: PdfColor.fromHex(
            '#374151',
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // PDF TABLE CELL
  // ==========================================================

  pw.Widget _pdfTableCell(
    String text, {
    bool center = false,
    bool right = false,
  }) {
    return pw.Padding(
      padding:
          const pw.EdgeInsets.symmetric(
        horizontal: 5,
        vertical: 8,
      ),
      child: pw.Text(
        text,
        textAlign: center
            ? pw.TextAlign.center
            : right
                ? pw.TextAlign.right
                : pw.TextAlign.left,
        style: pw.TextStyle(
          fontSize: 8,
          color: PdfColor.fromHex(
            '#111827',
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // PDF AMOUNT ROW
  // ==========================================================

  pw.Widget _pdfAmountRow(
    String title,
    dynamic amount,
    PdfColor darkColor,
    PdfColor grayColor, {
    bool isDiscount = false,
  }) {
    return pw.Padding(
      padding:
          const pw.EdgeInsets.symmetric(
        vertical: 4,
      ),
      child: pw.Row(
        mainAxisAlignment:
            pw.MainAxisAlignment
                .spaceBetween,
        children: [
          pw.Text(
            title,
            style: pw.TextStyle(
              fontSize: 9,
              color: grayColor,
            ),
          ),
          pw.Text(
            '${isDiscount ? "- " : ""}${_money(amount)}',
            style: pw.TextStyle(
              fontSize: 9,
              fontWeight:
                  pw.FontWeight.bold,
              color: isDiscount
                  ? PdfColor.fromHex(
                      '#DC2626',
                    )
                  : darkColor,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // DOWNLOAD / SAVE PDF
  // ==========================================================

  Future<void> _downloadPdf(
    BuildContext context,
  ) async {
    final colorScheme =
        Theme.of(context).colorScheme;

    try {
      final invoice =
          sale['invoice_number'] ??
              sale['invoice'] ??
              'receipt';

      final fileName =
          'receipt_${invoice.toString()}.pdf';

      await Printing.sharePdf(
        bytes: await _generatePdf(
          PdfPageFormat.a4,
        ),
        filename: fileName,
      );
    } catch (e) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context)
          .showSnackBar(
        SnackBar(
          behavior:
              SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(14),
          ),
          backgroundColor:
              colorScheme.error,
          content: Text(
            'Unable to generate PDF: '
            '${e.toString()}',
          ),
        ),
      );
    }
  }

  // ==========================================================
  // BUILD
  // ==========================================================

  @override
  Widget build(BuildContext context) {
    final colorScheme =
        Theme.of(context).colorScheme;

    final invoice =
        sale['invoice_number'] ??
            sale['invoice'] ??
            'N/A';

    final subtotal =
        sale['subtotal'] ?? 0;

    final discount =
        sale['discount'] ?? 0;

    final tax =
        sale['tax'] ?? 0;

    final grandTotal =
        sale['grand_total'] ??
            sale['total'] ??
            0;

    final cashier =
        sale['cashier_name'] ??
            sale['cashier'] ??
            'Cashier';

    final createdAt =
        sale['created_at'] ??
            sale['date'];

    final payments =
        sale['payments'] is List
            ? List<Map<String, dynamic>>.from(
                sale['payments'].map(
                  (payment) =>
                      Map<String, dynamic>.from(
                    payment,
                  ),
                ),
              )
            : <Map<String, dynamic>>[];

    final items =
        sale['items'] is List
            ? List<Map<String, dynamic>>.from(
                sale['items'].map(
                  (item) =>
                      Map<String, dynamic>.from(item),
                ),
              )
            : <Map<String, dynamic>>[];

    return Scaffold(
      backgroundColor:
          colorScheme.surfaceContainerLowest,

      // ======================================================
      // APP BAR
      // ======================================================

      appBar: AppBar(
        backgroundColor:
            colorScheme.surfaceContainerLowest,
        foregroundColor:
            colorScheme.onSurface,
        elevation: 0,
        automaticallyImplyLeading: false,
        centerTitle: false,
        titleSpacing: 20,

        title: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            Text(
              'Receipt',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 22,
                color: colorScheme.onSurface,
              ),
            ),
            Text(
              'Transaction completed',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: colorScheme
                    .onSurfaceVariant,
              ),
            ),
          ],
        ),

        actions: [
          // ==================================================
          // PDF BUTTON
          // ==================================================

          IconButton(
            onPressed: () =>
                _downloadPdf(context),
            tooltip: 'Download PDF',
            icon: Icon(
              Icons.picture_as_pdf_outlined,
              color: colorScheme.primary,
            ),
          ),

          const SizedBox(width: 8),
        ],
      ),

      // ======================================================
      // BODY
      // ======================================================

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            18,
            8,
            18,
            24,
          ),
          child: Column(
            children: [
              // ==================================================
              // SUCCESS HEADER
              // ==================================================

              _buildSuccessHeader(
                context,
                invoice.toString(),
              ),

              const SizedBox(height: 18),

              // ==================================================
              // RECEIPT CARD
              // ==================================================

              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.all(20),

                decoration: BoxDecoration(
                  color:
                      colorScheme.surfaceContainer,

                  borderRadius:
                      BorderRadius.circular(22),

                  border: Border.all(
                    color: colorScheme
                        .outlineVariant
                        .withOpacity(0.45),
                  ),

                  boxShadow: [
                    BoxShadow(
                      color: colorScheme.shadow
                          .withOpacity(0.06),
                      blurRadius: 16,
                      offset:
                          const Offset(0, 6),
                    ),
                  ],
                ),

                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    // ==========================================
                    // STORE HEADER
                    // ==========================================

                    _buildStoreHeader(
                      context,
                      invoice.toString(),
                      _formatDate(createdAt),
                      cashier.toString(),
                    ),

                    const SizedBox(height: 20),

                    _divider(context),

                    const SizedBox(height: 18),

                    // ==========================================
                    // ITEMS
                    // ==========================================

                    _sectionTitle(
                      context,
                      icon: Icons
                          .shopping_bag_outlined,
                      title: 'Items',
                    ),

                    const SizedBox(height: 12),

                    if (items.isEmpty)
                      _emptyInfo(
                        context,
                        'Item details are not available.',
                      )
                    else
                      ...items.map(
                        (item) => _buildItem(
                          context,
                          item,
                        ),
                      ),

                    const SizedBox(height: 8),

                    _divider(context),

                    const SizedBox(height: 14),

                    // ==========================================
                    // TOTALS
                    // ==========================================

                    _sectionTitle(
                      context,
                      icon: Icons
                          .receipt_long_outlined,
                      title: 'Summary',
                    ),

                    const SizedBox(height: 12),

                    _amountRow(
                      context,
                      'Subtotal',
                      subtotal,
                    ),

                    _amountRow(
                      context,
                      'Discount',
                      discount,
                      isDiscount: true,
                    ),

                    _amountRow(
                      context,
                      'Tax',
                      tax,
                    ),

                    const SizedBox(height: 10),

                    _buildGrandTotal(
                      context,
                      grandTotal,
                    ),

                    const SizedBox(height: 22),

                    // ==========================================
                    // PAYMENT
                    // ==========================================

                    _sectionTitle(
                      context,
                      icon: Icons
                          .payments_outlined,
                      title: 'Payment',
                    ),

                    const SizedBox(height: 12),

                    if (payments.isEmpty)
                      _emptyInfo(
                        context,
                        'Payment information unavailable.',
                      )
                    else
                      ...payments.map(
                        (payment) =>
                            _buildPaymentRow(
                          context,
                          payment,
                        ),
                      ),

                    const SizedBox(height: 18),

                    _divider(context),

                    const SizedBox(height: 16),

                    // ==========================================
                    // THANK YOU
                    // ==========================================

                    Center(
                      child: Column(
                        children: [
                          Icon(
                            Icons
                                .favorite_outline_rounded,
                            size: 20,
                            color:
                                colorScheme.primary,
                          ),

                          const SizedBox(height: 7),

                          Text(
                            'Thank you for your purchase!',
                            style: TextStyle(
                              fontWeight:
                                  FontWeight.w700,
                              fontSize: 13,
                              color: colorScheme
                                  .onSurface,
                            ),
                          ),

                          const SizedBox(height: 3),

                          Text(
                            'Please visit us again.',
                            style: TextStyle(
                              fontSize: 11,
                              color: colorScheme
                                  .onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // ==================================================
              // DOWNLOAD PDF
              // ==================================================

              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton.icon(
                  onPressed: () =>
                      _downloadPdf(context),

                  icon: const Icon(
                    Icons.download_rounded,
                  ),

                  label: const Text(
                    'Download Receipt PDF',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight:
                          FontWeight.w800,
                    ),
                  ),

                  style:
                      FilledButton.styleFrom(
                    backgroundColor:
                        colorScheme.primary,

                    foregroundColor:
                        colorScheme.onPrimary,

                    shape:
                        RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              // ==================================================
              // NEW SALE
              // ==================================================

              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.popUntil(
                      context,
                      (route) =>
                          route.isFirst,
                    );
                  },

                  icon: const Icon(
                    Icons
                        .add_shopping_cart_rounded,
                  ),

                  label: const Text(
                    'New Sale',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight:
                          FontWeight.w800,
                    ),
                  ),

                  style:
                      FilledButton.styleFrom(
                    backgroundColor:
                        colorScheme
                            .surfaceContainerHigh,

                    foregroundColor:
                        colorScheme.primary,

                    shape:
                        RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              // ==================================================
              // BACK
              // ==================================================

              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                  },

                  icon: const Icon(
                    Icons.arrow_back_rounded,
                    size: 19,
                  ),

                  label: const Text(
                    'Back',
                    style: TextStyle(
                      fontWeight:
                          FontWeight.w700,
                    ),
                  ),

                  style:
                      OutlinedButton.styleFrom(
                    foregroundColor:
                        colorScheme.onSurface,

                    side: BorderSide(
                      color: colorScheme
                          .outlineVariant,
                    ),

                    shape:
                        RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // SUCCESS HEADER
  // ==========================================================

  Widget _buildSuccessHeader(
    BuildContext context,
    String invoice,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),

      decoration: BoxDecoration(
        color:
            colorScheme.primaryContainer,

        borderRadius:
            BorderRadius.circular(22),

        border: Border.all(
          color: colorScheme.primary
              .withOpacity(0.18),
        ),
      ),

      child: Column(
        children: [
          Container(
            width: 68,
            height: 68,

            decoration: BoxDecoration(
              color: colorScheme.primary,
              shape: BoxShape.circle,

              boxShadow: [
                BoxShadow(
                  color: colorScheme.primary
                      .withOpacity(0.25),
                  blurRadius: 15,
                  offset:
                      const Offset(0, 5),
                ),
              ],
            ),

            child: Icon(
              Icons.check_rounded,
              color:
                  colorScheme.onPrimary,
              size: 40,
            ),
          ),

          const SizedBox(height: 15),

          Text(
            'Sale Completed',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color:
                  colorScheme.primary,
            ),
          ),

          const SizedBox(height: 6),

          Container(
            padding:
                const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 6,
            ),

            decoration: BoxDecoration(
              color: colorScheme
                  .surfaceContainerHighest,
              borderRadius:
                  BorderRadius.circular(20),
            ),

            child: Text(
              invoice,
              style: TextStyle(
                fontSize: 13,
                color: colorScheme
                    .onSurfaceVariant,
                fontWeight:
                    FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // STORE HEADER
  // ==========================================================

  Widget _buildStoreHeader(
    BuildContext context,
    String invoice,
    String date,
    String cashier,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Column(
      children: [
        Container(
          width: 54,
          height: 54,

          decoration: BoxDecoration(
            color:
                colorScheme.primaryContainer,
            borderRadius:
                BorderRadius.circular(16),
          ),

          child: Icon(
            Icons.storefront_rounded,
            color: colorScheme.primary,
            size: 28,
          ),
        ),

        const SizedBox(height: 12),

        Text(
          'RETAIL POS',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
            color:
                colorScheme.onSurface,
          ),
        ),

        const SizedBox(height: 3),

        Text(
          'Sales Receipt',
          style: TextStyle(
            color:
                colorScheme.onSurfaceVariant,
            fontSize: 13,
          ),
        ),

        const SizedBox(height: 18),

        Container(
          width: double.infinity,
          padding:
              const EdgeInsets.all(14),

          decoration: BoxDecoration(
            color: colorScheme
                .surfaceContainerHigh,
            borderRadius:
                BorderRadius.circular(14),
          ),

          child: Column(
            children: [
              _infoRow(
                context,
                'Invoice',
                invoice,
              ),

              _infoRow(
                context,
                'Date & Time',
                date,
              ),

              _infoRow(
                context,
                'Cashier',
                cashier,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // INFO ROW
  // ==========================================================

  Widget _infoRow(
    BuildContext context,
    String title,
    String value,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Padding(
      padding:
          const EdgeInsets.symmetric(
        vertical: 4,
      ),

      child: Row(
        children: [
          SizedBox(
            width: 85,
            child: Text(
              title,
              style: TextStyle(
                color: colorScheme
                    .onSurfaceVariant,
                fontSize: 12,
              ),
            ),
          ),

          const SizedBox(width: 8),

          Expanded(
            child: Text(
              value,
              textAlign:
                  TextAlign.right,
              style: TextStyle(
                fontSize: 12,
                fontWeight:
                    FontWeight.w700,
                color:
                    colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  Widget _sectionTitle(
    BuildContext context, {
    required IconData icon,
    required String title,
  }) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Row(
      children: [
        Container(
          padding:
              const EdgeInsets.all(8),

          decoration: BoxDecoration(
            color:
                colorScheme.primaryContainer,
            borderRadius:
                BorderRadius.circular(10),
          ),

          child: Icon(
            icon,
            size: 18,
            color: colorScheme.primary,
          ),
        ),

        const SizedBox(width: 10),

        Text(
          title,
          style: TextStyle(
            fontSize: 17,
            fontWeight:
                FontWeight.w800,
            color:
                colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // ITEM
  // ==========================================================

  Widget _buildItem(
    BuildContext context,
    Map<String, dynamic> item,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    final name =
        item['name'] ??
            item['item_name'] ??
            'Item';

    final quantity =
        item['quantity'] ?? 0;

    final unitPrice =
        item['unit_price'] ?? 0;

    final lineTotal =
        item['line_total'] ??
            item['total'] ??
            (_number(unitPrice) *
                _number(quantity));

    return Container(
      margin:
          const EdgeInsets.only(
        bottom: 9,
      ),

      padding:
          const EdgeInsets.all(13),

      decoration: BoxDecoration(
        color: colorScheme
            .surfaceContainerHigh,

        borderRadius:
            BorderRadius.circular(14),

        border: Border.all(
          color: colorScheme
              .outlineVariant
              .withOpacity(0.35),
        ),
      ),

      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.center,
        children: [
          Container(
            width: 40,
            height: 40,

            decoration: BoxDecoration(
              color: colorScheme
                  .primaryContainer,
              borderRadius:
                  BorderRadius.circular(11),
            ),

            child: Icon(
              Icons.inventory_2_outlined,
              size: 20,
              color:
                  colorScheme.primary,
            ),
          ),

          const SizedBox(width: 11),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  name.toString(),
                  maxLines: 2,
                  overflow:
                      TextOverflow.ellipsis,

                  style: TextStyle(
                    fontWeight:
                        FontWeight.w700,
                    color:
                        colorScheme.onSurface,
                    fontSize: 14,
                  ),
                ),

                const SizedBox(height: 5),

                Text(
                  '$quantity × ${_money(unitPrice)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme
                        .onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 10),

          Text(
            _money(lineTotal),
            style: TextStyle(
              fontWeight:
                  FontWeight.w900,
              fontSize: 14,
              color:
                  colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // AMOUNT ROW
  // ==========================================================

  Widget _amountRow(
    BuildContext context,
    String title,
    dynamic amount, {
    bool isDiscount = false,
  }) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Padding(
      padding:
          const EdgeInsets.symmetric(
        vertical: 5,
      ),

      child: Row(
        mainAxisAlignment:
            MainAxisAlignment
                .spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              color: colorScheme
                  .onSurfaceVariant,
              fontSize: 13,
            ),
          ),

          Text(
            '${isDiscount ? "- " : ""}${_money(amount)}',
            style: TextStyle(
              fontWeight:
                  FontWeight.w700,
              color: isDiscount
                  ? colorScheme.error
                  : colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // GRAND TOTAL
  // ==========================================================

  Widget _buildGrandTotal(
    BuildContext context,
    dynamic grandTotal,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,

      padding:
          const EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 15,
      ),

      decoration: BoxDecoration(
        color:
            colorScheme.primaryContainer,

        borderRadius:
            BorderRadius.circular(14),

        border: Border.all(
          color: colorScheme.primary
              .withOpacity(0.15),
        ),
      ),

      child: Row(
        mainAxisAlignment:
            MainAxisAlignment
                .spaceBetween,

        children: [
          Text(
            'Grand Total',
            style: TextStyle(
              fontSize: 17,
              fontWeight:
                  FontWeight.w900,
              color: colorScheme
                  .onPrimaryContainer,
            ),
          ),

          Text(
            _money(grandTotal),
            style: TextStyle(
              fontSize: 20,
              fontWeight:
                  FontWeight.w900,
              color:
                  colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // PAYMENT ROW
  // ==========================================================

  Widget _buildPaymentRow(
    BuildContext context,
    Map<String, dynamic> payment,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    final method =
        payment['payment_method'] ??
            'Unknown';

    final amount =
        payment['amount'] ?? 0;

    final isCash =
        method.toString().toUpperCase() ==
            'CASH';

    return Container(
      margin:
          const EdgeInsets.only(
        bottom: 8,
      ),

      padding:
          const EdgeInsets.symmetric(
        horizontal: 13,
        vertical: 12,
      ),

      decoration: BoxDecoration(
        color: colorScheme
            .surfaceContainerHigh,

        borderRadius:
            BorderRadius.circular(13),

        border: Border.all(
          color: colorScheme
              .outlineVariant
              .withOpacity(0.35),
        ),
      ),

      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,

            decoration: BoxDecoration(
              color: colorScheme
                  .primaryContainer,
              borderRadius:
                  BorderRadius.circular(11),
            ),

            child: Icon(
              isCash
                  ? Icons
                      .payments_outlined
                  : Icons
                      .credit_card_rounded,
              size: 21,
              color:
                  colorScheme.primary,
            ),
          ),

          const SizedBox(width: 11),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment
                      .start,
              children: [
                Text(
                  method.toString(),
                  style: TextStyle(
                    fontWeight:
                        FontWeight.w800,
                    color:
                        colorScheme.onSurface,
                    fontSize: 13,
                  ),
                ),

                const SizedBox(height: 2),

                Text(
                  'Payment received',
                  style: TextStyle(
                    fontSize: 11,
                    color: colorScheme
                        .onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          Text(
            _money(amount),
            style: TextStyle(
              fontWeight:
                  FontWeight.w900,
              color:
                  colorScheme.primary,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // EMPTY INFO
  // ==========================================================

  Widget _emptyInfo(
    BuildContext context,
    String message,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,

      padding:
          const EdgeInsets.all(14),

      decoration: BoxDecoration(
        color: colorScheme
            .surfaceContainerHigh,
        borderRadius:
            BorderRadius.circular(12),
      ),

      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            size: 19,
            color: colorScheme
                .onSurfaceVariant,
          ),

          const SizedBox(width: 9),

          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 12,
                color: colorScheme
                    .onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // DIVIDER
  // ==========================================================

  Widget _divider(
    BuildContext context,
  ) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Divider(
      height: 1,
      color: colorScheme
          .outlineVariant
          .withOpacity(0.45),
    );
  }
}