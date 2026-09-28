import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../core/storage/secure_storage.dart';
import 'receipt_page.dart';

class SalesHistoryPage extends StatefulWidget {
  const SalesHistoryPage({super.key});

  @override
  State<SalesHistoryPage> createState() => _SalesHistoryPageState();
}

class _SalesHistoryPageState extends State<SalesHistoryPage> {
  // ==========================================================
  // PROFESSIONAL POS COLOR PALETTE
  // ==========================================================

  static const Color background = Color(0xFF0B1220);
  static const Color surface = Color(0xFF111827);
  static const Color surfaceLight = Color(0xFF172033);
  static const Color surfaceLighter = Color(0xFF1E293B);

  static const Color primary = Color(0xFF14B8A6);
  static const Color primaryDark = Color(0xFF0F766E);

  static const Color textPrimary = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color border = Color(0xFF334155);

  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color blue = Color(0xFF38BDF8);

  // ==========================================================
  // API
  // ==========================================================

  final Dio dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  List<Map<String, dynamic>> sales = [];

  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    loadSales();
  }

  // ==========================================================
  // LOAD SALES FROM BACKEND
  // ==========================================================

  Future<void> loadSales() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final token = await SecureStorage.getToken();

      if (token == null || token.isEmpty) {
        throw Exception(
          'User is not logged in.',
        );
      }

      final response = await dio.get(
        '/sales',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );

      if (response.data is List) {
        final List data = response.data;

        setState(() {
          sales = data
              .map(
                (sale) => Map<String, dynamic>.from(
                  sale,
                ),
              )
              .toList();

          isLoading = false;
        });
      } else {
        throw Exception(
          'Invalid sales data received.',
        );
      }
    } on DioException catch (e) {
      String message = 'Unable to load sales.';

      if (e.response != null) {
        if (e.response!.data is Map &&
            e.response!.data['detail'] != null) {
          message = e.response!.data['detail'].toString();
        } else {
          message = 'Server error: ${e.response!.statusCode}';
        }
      } else {
        message =
            'Unable to connect to the server. Please check your connection.';
      }

      setState(() {
        isLoading = false;
        errorMessage = message;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Something went wrong.';
      });
    }
  }

  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  String money(dynamic value) {
    final number =
        double.tryParse(
          value?.toString() ?? '0',
        ) ??
        0;

    return 'Rs. ${number.toStringAsFixed(2)}';
  }

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  String formatDate(
    dynamic date,
  ) {
    if (date == null) {
      return '';
    }

    try {
      final parsed = DateTime.parse(
        date.toString(),
      ).toLocal();

      return DateFormat(
        'dd MMM yyyy, hh:mm a',
      ).format(parsed);
    } catch (_) {
      return date.toString();
    }
  }

  // ==========================================================
  // PAYMENT ICON
  // ==========================================================

  IconData paymentIcon(
    String payment,
  ) {
    switch (payment.toLowerCase()) {
      case 'cash':
        return Icons.payments_outlined;

      case 'card':
        return Icons.credit_card_outlined;

      case 'split':
        return Icons.call_split_rounded;

      default:
        return Icons.payment_outlined;
    }
  }

  // ==========================================================
  // PAYMENT COLOR
  // ==========================================================

  Color paymentColor(
    String payment,
  ) {
    switch (payment.toLowerCase()) {
      case 'cash':
        return success;

      case 'card':
        return blue;

      case 'split':
        return warning;

      default:
        return textSecondary;
    }
  }

  // ==========================================================
  // OPEN SALE RECEIPT
  // ==========================================================

  Future<void> openSaleReceipt(
    Map<String, dynamic> sale,
  ) async {
    try {
      final saleId = sale['id'];

      if (saleId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            backgroundColor: error,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            content: const Text(
              'Sale ID is missing.',
            ),
          ),
        );

        return;
      }

      final token = await SecureStorage.getToken();

      if (token == null || token.isEmpty) {
        return;
      }

      // ------------------------------------------------------
      // Try to get complete sale details
      // ------------------------------------------------------

      final response = await dio.get(
        '/sales/$saleId',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );

      if (!mounted) return;

      if (response.data is Map) {
        final completeSale = Map<String, dynamic>.from(
          response.data,
        );

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ReceiptPage(
              sale: completeSale,
            ),
          ),
        );
      }
    } on DioException catch (e) {
      // ------------------------------------------------------
      // If detailed endpoint is not available yet,
      // show a basic receipt using existing data.
      // ------------------------------------------------------

      if (!mounted) return;

      final statusCode = e.response?.statusCode;

      if (statusCode == 404) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ReceiptPage(
              sale: sale,
            ),
          ),
        );

        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: error,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          content: Text(
            e.response?.data is Map &&
                    (e.response?.data as Map)['detail'] != null
                ? (e.response?.data as Map)['detail'].toString()
                : 'Unable to open receipt.',
          ),
        ),
      );
    } catch (_) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: error,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          content: const Text(
            'Unable to open receipt.',
          ),
        ),
      );
    }
  }

  // ==========================================================
  // SALE CARD
  // ==========================================================

  Widget saleCard(
    Map<String, dynamic> sale,
  ) {
    final invoice =
        sale['invoice']?.toString() ??
        sale['invoice_number']?.toString() ??
        'N/A';

    final date = sale['date']?.toString() ?? '';

    final time = sale['time']?.toString() ?? '';

    final total =
        sale['total'] ??
        sale['grand_total'] ??
        0;

    final payment =
        sale['payment']?.toString() ??
        'Unknown';

    final itemCount = sale['items'] ?? 0;

    final status =
        sale['status']?.toString() ??
        'COMPLETED';

    final paymentIconData = paymentIcon(payment);

    final paymentColorValue = paymentColor(payment);

    final isCompleted =
        status.toUpperCase() == 'COMPLETED';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      child: Material(
        color: surface,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            openSaleReceipt(sale);
          },
          borderRadius: BorderRadius.circular(18),
          splashColor: primary.withOpacity(0.08),
          highlightColor: primary.withOpacity(0.04),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: border.withOpacity(0.7),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.16),
                  blurRadius: 12,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              children: [
                // ------------------------------------------------
                // TOP ROW
                // ------------------------------------------------

                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF0F766E),
                            Color(0xFF14B8A6),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius:
                            BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.receipt_long_rounded,
                        color: textPrimary,
                        size: 24,
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text(
                            invoice,
                            maxLines: 1,
                            overflow:
                                TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: textPrimary,
                            ),
                          ),

                          const SizedBox(height: 5),

                          Row(
                            children: [
                              const Icon(
                                Icons.schedule_rounded,
                                size: 13,
                                color: textSecondary,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  date.isNotEmpty &&
                                          time.isNotEmpty
                                      ? '$date • $time'
                                      : (date.isNotEmpty
                                          ? date
                                          : time),
                                  maxLines: 1,
                                  overflow:
                                      TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    color: textSecondary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 8),

                    Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.end,
                      children: [
                        const Text(
                          'TOTAL',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          money(total),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 15),

                Divider(
                  height: 1,
                  color: border.withOpacity(0.55),
                ),

                const SizedBox(height: 13),

                // ------------------------------------------------
                // BOTTOM INFORMATION
                // ------------------------------------------------

                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding:
                                const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: surfaceLighter,
                              borderRadius:
                                  BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.shopping_bag_outlined,
                              size: 15,
                              color: textSecondary,
                            ),
                          ),

                          const SizedBox(width: 7),

                          Flexible(
                            child: Text(
                              '$itemCount item${itemCount == 1 ? '' : 's'}',
                              overflow:
                                  TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: textSecondary,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    Expanded(
                      child: Row(
                        mainAxisAlignment:
                            MainAxisAlignment.center,
                        children: [
                          Icon(
                            paymentIconData,
                            size: 17,
                            color: paymentColorValue,
                          ),

                          const SizedBox(width: 6),

                          Flexible(
                            child: Text(
                              payment,
                              overflow:
                                  TextOverflow.ellipsis,
                              style: TextStyle(
                                color: paymentColorValue,
                                fontWeight: FontWeight.w600,
                                fontSize: 12.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    Container(
                      padding:
                          const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? success.withOpacity(0.12)
                            : error.withOpacity(0.12),
                        borderRadius:
                            BorderRadius.circular(8),
                        border: Border.all(
                          color: isCompleted
                              ? success.withOpacity(0.25)
                              : error.withOpacity(0.25),
                        ),
                      ),
                      child: Row(
                        mainAxisSize:
                            MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isCompleted
                                  ? success
                                  : error,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            status,
                            style: TextStyle(
                              color: isCompleted
                                  ? success
                                  : error,
                              fontSize: 10,
                              fontWeight:
                                  FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 13),

                // ------------------------------------------------
                // VIEW RECEIPT
                // ------------------------------------------------

                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: primary.withOpacity(0.06),
                    borderRadius:
                        BorderRadius.circular(10),
                    border: Border.all(
                      color: primary.withOpacity(0.12),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment:
                        MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.receipt_long_outlined,
                        size: 16,
                        color: primary,
                      ),
                      const SizedBox(width: 7),
                      const Text(
                        'View Receipt',
                        style: TextStyle(
                          color: primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 11,
                        color: primary,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  Widget emptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment:
              MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    primary.withOpacity(0.15),
                    primary.withOpacity(0.05),
                  ],
                ),
                shape: BoxShape.circle,
                border: Border.all(
                  color: primary.withOpacity(0.18),
                ),
              ),
              child: const Icon(
                Icons.receipt_long_outlined,
                size: 56,
                color: primary,
              ),
            ),

            const SizedBox(height: 22),

            const Text(
              'No Sales Yet',
              style: TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.bold,
                color: textPrimary,
              ),
            ),

            const SizedBox(height: 8),

            const Text(
              'Completed sales will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: textSecondary,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  Widget errorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment:
              MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: error.withOpacity(0.10),
                shape: BoxShape.circle,
                border: Border.all(
                  color: error.withOpacity(0.20),
                ),
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                size: 56,
                color: error,
              ),
            ),

            const SizedBox(height: 22),

            const Text(
              'Unable to Load Sales',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.bold,
                color: textPrimary,
              ),
            ),

            const SizedBox(height: 8),

            Text(
              errorMessage ?? 'Something went wrong.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: textSecondary,
                fontSize: 14,
              ),
            ),

            const SizedBox(height: 24),

            SizedBox(
              height: 48,
              child: FilledButton.icon(
                onPressed: loadSales,
                style: FilledButton.styleFrom(
                  backgroundColor: primary,
                  foregroundColor: background,
                  padding:
                      const EdgeInsets.symmetric(
                    horizontal: 22,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(13),
                  ),
                ),
                icon: const Icon(
                  Icons.refresh_rounded,
                ),
                label: const Text(
                  'Try Again',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // BUILD
  // ==========================================================

  @override
  Widget build(
    BuildContext context,
  ) {
    return Scaffold(
      backgroundColor: background,

      appBar: AppBar(
        title: const Text(
          'Sales History',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: textPrimary,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        backgroundColor: background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,

        leading: IconButton(
          onPressed: () {
            Navigator.pop(context);
          },
          icon: Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: surface,
              borderRadius:
                  BorderRadius.circular(10),
              border: Border.all(
                color: border.withOpacity(0.7),
              ),
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 17,
              color: textPrimary,
            ),
          ),
        ),

        actions: [
          Padding(
            padding:
                const EdgeInsets.only(right: 12),
            child: IconButton(
              onPressed:
                  isLoading ? null : loadSales,
              tooltip: 'Refresh',
              icon: Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: surface,
                  borderRadius:
                      BorderRadius.circular(10),
                  border: Border.all(
                    color: border.withOpacity(0.7),
                  ),
                ),
                child: Icon(
                  Icons.refresh_rounded,
                  color: isLoading
                      ? textSecondary
                      : primary,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),

      body: RefreshIndicator(
        color: primary,
        backgroundColor: surface,
        onRefresh: loadSales,

        child: Builder(
          builder: (context) {
            // ------------------------------------------------
            // LOADING
            // ------------------------------------------------

            if (isLoading) {
              return const Center(
                child: CircularProgressIndicator(
                  color: primary,
                ),
              );
            }

            // ------------------------------------------------
            // ERROR
            // ------------------------------------------------

            if (errorMessage != null) {
              return errorState();
            }

            // ------------------------------------------------
            // EMPTY
            // ------------------------------------------------

            if (sales.isEmpty) {
              return emptyState();
            }

            // ------------------------------------------------
            // SALES LIST
            // ------------------------------------------------

            return ListView.builder(
              physics:
                  const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(
                16,
                8,
                16,
                24,
              ),
              itemCount: sales.length,
              itemBuilder: (context, index) {
                return saleCard(
                  sales[index],
                );
              },
            );
          },
        ),
      ),
    );
  }
}