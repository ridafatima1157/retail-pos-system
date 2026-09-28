import 'package:dio/dio.dart';
import '../constants/api_constants.dart';

class ApiClient {
  final Dio dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
    ),
  );

  Future<Response> post(
    String endpoint, {
    Map<String, dynamic>? data,
  }) async {
    try {
      print('====================================');
      print('POST REQUEST');
      print('URL: ${dio.options.baseUrl}$endpoint');
      print('DATA: $data');

      final response = await dio.post(
        endpoint,
        data: data,
      );

      print('STATUS CODE: ${response.statusCode}');
      print('RESPONSE: ${response.data}');
      print('====================================');

      return response;
    } on DioException catch (e) {
      print('====================================');
      print('API ERROR');
      print('TYPE: ${e.type}');
      print('URL: ${e.requestOptions.uri}');
      print('MESSAGE: ${e.message}');
      print('STATUS CODE: ${e.response?.statusCode}');
      print('RESPONSE: ${e.response?.data}');
      print('====================================');

      rethrow;
    } catch (e) {
      print('====================================');
      print('UNKNOWN ERROR');
      print('ERROR: $e');
      print('====================================');

      rethrow;
    }
  }

  Future<Response> get(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      print('====================================');
      print('GET REQUEST');
      print('URL: ${dio.options.baseUrl}$endpoint');
      print('QUERY PARAMETERS: $queryParameters');

      final response = await dio.get(
        endpoint,
        queryParameters: queryParameters,
      );

      print('STATUS CODE: ${response.statusCode}');
      print('RESPONSE: ${response.data}');
      print('====================================');

      return response;
    } on DioException catch (e) {
      print('====================================');
      print('API ERROR');
      print('TYPE: ${e.type}');
      print('URL: ${e.requestOptions.uri}');
      print('MESSAGE: ${e.message}');
      print('STATUS CODE: ${e.response?.statusCode}');
      print('RESPONSE: ${e.response?.data}');
      print('====================================');

      rethrow;
    } catch (e) {
      print('====================================');
      print('UNKNOWN ERROR');
      print('ERROR: $e');
      print('====================================');

      rethrow;
    }
  }
}