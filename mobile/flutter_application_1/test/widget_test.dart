import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('POS app loads', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('POS Mobile App'), findsOneWidget);
  });
}