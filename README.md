# Retail POS System

A full-stack Retail Point of Sale (POS) System** designed for walk-in retail customers. The system includes a **Flutter mobile POS application**, a React.js Admin Panel**, a **FastAPI backend**, and a **PostgreSQL database**.

## Project Features

### Mobile POS Application

The mobile application is developed using **Flutter and Dart**.

* User authentication
* Product listing and search
* Product name, SKU, barcode, price, and stock display
* Barcode scanning using the mobile camera
* Add products to cart
* Increase, decrease, and remove cart items
* Automatic subtotal and total calculation
* Tax calculation
* Cash payment
* Card payment
* Split payment between cash and card
* Cash change calculation
* Complete sales transactions
* Sales history
* Detailed receipts
* PDF receipt generation
* Receipt download, sharing, and printing

### Web Admin Panel

The Admin Panel is developed using **React.js, Vite, and Tailwind CSS**.

* Admin/user authentication
* Dashboard
* Today's sales overview
* Transaction count
* Cash and card payment breakdown
* Product/item management
* Inventory management
* Product search
* Add new products
* Stock adjustment
* Stock movement history
* Sales management
* Sales transaction history
* Reports
* User management
* Audit logs
* Responsive interface

### Inventory Management

Administrators can add products with:

* Product name
* SKU
* Barcode
* Category
* Cost price
* Selling price
* Tax rate
* Current stock

The system also supports stock adjustments. Administrators can add or remove stock, enter the quantity, provide a reason, and view the stock movement history.

### Reports

The Admin Panel provides:

* Full Report
* Sales Detail Report
* Sales Balance Report
* Stock Movement Report

### User Management

Administrators can create users by providing:

* Full name
* Email
* Password
* Role

The system supports role-based access. Administrators have management permissions, while regular users have restricted permissions.

### Audit Logs

The Audit Log records important system activities such as:

* User activities
* Product changes
* Inventory adjustments
* Sales-related activities
* Other important system actions

---

# Technology Stack

## Mobile Application

* Flutter
* Dart
* Dio
* Flutter Material UI
* PDF
* Printing

## Web/Admin Panel

* React.js
* JavaScript
* Vite
* Tailwind CSS
* Axios
* Lucide React

## Backend

* Python
* FastAPI
* REST APIs
* JSON
* Authentication
* Role-based access

## Database

* PostgreSQL

## Development Tools

* Visual Studio Code
* Git
* GitHub
* Android Emulator / Physical Android Device

---

# Project Structure

```text
retail-pos-system/
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── mobile/
│   ├── lib/
│   ├── pubspec.yaml
│   └── ...
│
└── README.md
```

---

# Database

The project uses **PostgreSQL** as the main database.

Main tables include:

| Table                | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `users`              | Stores user accounts, credentials, and roles     |
| `items` / `products` | Stores product information, prices, and stock    |
| `sales`              | Stores completed sales                           |
| `sale_items`         | Stores products and quantities included in sales |
| `payments`           | Stores payment information                       |
| `audit_logs`         | Stores important system activities               |

The mobile application and Admin Panel communicate with the FastAPI backend, which handles communication with PostgreSQL.

---

