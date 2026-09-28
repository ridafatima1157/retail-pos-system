import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const FlutterSecureStorage _storage =
      FlutterSecureStorage();

  static const String tokenKey = 'access_token';

  static Future<void> saveToken(String token) async {
    await _storage.write(
      key: tokenKey,
      value: token,
    );
  }

  static Future<String?> getToken() async {
    return await _storage.read(
      key: tokenKey,
    );
  }

  static Future<void> deleteToken() async {
    await _storage.delete(
      key: tokenKey,
    );
  }
}