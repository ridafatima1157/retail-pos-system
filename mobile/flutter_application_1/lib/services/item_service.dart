import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../core/storage/secure_storage.dart';
import '../models/item.dart';

class ItemService {
  final Dio dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  // ================= GET ALL ITEMS =================

  Future<List<Item>> getItems({
    String search = '',
  }) async {
    final token = await SecureStorage.getToken();

    final response = await dio.get(
      '/items',
      queryParameters: {
        'search': search,
        'active_only': true,
      },
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    final List data = response.data;

    return data
        .map(
          (json) => Item.fromJson(json),
        )
        .toList();
  }

  // ================= GET ITEM BY BARCODE =================

  Future<Item> getItemByBarcode(String barcode) async {
    final token = await SecureStorage.getToken();

    if (token == null || token.isEmpty) {
      throw Exception('User is not logged in');
    }

    try {
      final response = await dio.get(
        '/items/barcode/$barcode',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );

      return Item.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response != null) {
        final data = e.response!.data;

        if (data is Map && data['detail'] != null) {
          throw Exception(
            data['detail'].toString(),
          );
        }

        throw Exception(
          'Unable to find item',
        );
      }

      throw Exception(
        'Unable to connect to the server',
      );
    }
  }
}