class Item {
  final int id;
  final String sku;
  final String barcode;
  final String name;
  final int? categoryId;
  final double costPrice;
  final double sellingPrice;
  final double taxRate;
  final int currentStock;
  final int reorderLevel;
  final bool isActive;

  Item({
    required this.id,
    required this.sku,
    required this.barcode,
    required this.name,
    required this.categoryId,
    required this.costPrice,
    required this.sellingPrice,
    required this.taxRate,
    required this.currentStock,
    required this.reorderLevel,
    required this.isActive,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      id: json['id'],
      sku: json['sku'] ?? '',
      barcode: json['barcode'] ?? '',
      name: json['name'] ?? '',
      categoryId: json['category_id'],
      costPrice: double.tryParse(
            json['cost_price'].toString(),
          ) ??
          0,
      sellingPrice: double.tryParse(
            json['selling_price'].toString(),
          ) ??
          0,
      taxRate: double.tryParse(
            json['tax_rate'].toString(),
          ) ??
          0,
      currentStock: json['current_stock'] ?? 0,
      reorderLevel: json['reorder_level'] ?? 0,
      isActive: json['is_active'] ?? false,
    );
  }
}