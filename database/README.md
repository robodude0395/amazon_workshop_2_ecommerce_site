# Database Setup

## Prerequisites

- MySQL 8.0 or higher installed
- MySQL server running on localhost:3306

## Setup Instructions

1. **Create the database and tables:**

```bash
mysql -u root -p < schema.sql
```

2. **Verify the schema:**

```bash
mysql -u root -p smiths_detection_ecommerce
```

Then run:

```sql
SHOW TABLES;
DESCRIBE products;
DESCRIBE cart_items;
```

## Schema Overview

### Products Table

Stores product catalog information loaded from CSV file.

- `id`: Auto-incrementing primary key
- `part_number`: Unique product identifier (indexed)
- `description`: Product description text
- `price`: Product price (DECIMAL for precision)
- `created_at`: Timestamp of record creation

### Cart Items Table

Stores shopping cart items with product references.

- `id`: Auto-incrementing primary key
- `product_id`: Foreign key to products table (indexed)
- `quantity`: Item quantity (must be > 0)
- `created_at`: Timestamp of item addition
- `updated_at`: Timestamp of last update

### Constraints

- Foreign key: `cart_items.product_id` → `products.id` with CASCADE delete
- Unique constraint: `products.part_number`
- Check constraint: `cart_items.quantity > 0`

## Notes

- The backend will automatically import products from `product_list.csv` on first startup if the products table is empty
- All timestamps use MySQL's TIMESTAMP type with automatic management
- InnoDB engine ensures ACID compliance for cart operations
