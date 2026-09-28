import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/constants/api_constants.dart';

class SaleService {
  final Dio dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  final FlutterSecureStorage storage =
      const FlutterSecureStorage();

  Future<Map<String, dynamic>> createSale({
    required List<Map<String, dynamic>> items,
    required List<Map<String, dynamic>> payments,
    double discount = 0,
  }) async {
    final token = await storage.read(
      key: 'access_token',
    );

    if (token == null || token.isEmpty) {
      throw Exception('User is not logged in');
    }

    final idempotencyKey =
        'mobile-${DateTime.now().microsecondsSinceEpoch}';

    final requestData = {
      'items': items,
      'discount': discount,
      'payments': payments,
      'idempotency_key': idempotencyKey,
    };

    try {
      final response = await dio.post(
        '/sales',
        data: requestData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );

      return Map<String, dynamic>.from(
        response.data,
      );
    } on DioException catch (e) {
      if (e.response != null) {
        final data = e.response!.data;

        if (data is Map &&
            data['detail'] != null) {
          throw Exception(
            data['detail'].toString(),
          );
        }

        throw Exception(
          'Sale failed: ${e.response!.statusCode}',
        );
      }

      throw Exception(
        'Unable to connect to the server. '
        'Please check your connection.',
      );
    } catch (e) {
      throw Exception(
        'Unable to complete sale.',
      );
    }
  }
}