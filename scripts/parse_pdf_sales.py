import os
import sys
import re
import json

def parse_pdf_to_excel_or_csv(pdf_path, output_format='csv'):
    """
    Parses Reach POS or inventory invoice PDFs into a clean structured CSV/Excel format
    ready for uploading into the Stockist App.
    """
    try:
        import pdfplumber
    except ImportError:
        print("Installing required pdfplumber dependency...")
        os.system(f"{sys.executable} -m pip install pdfplumber pandas openpyxl")
        import pdfplumber

    import pandas as pd

    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return None

    rows = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            # 1. Try extracting tables first
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                header = [str(cell or '').strip().lower() for cell in table[0]]
                name_idx = next((i for i, h in enumerate(header) if 'item' in h or 'product' in h or 'description' in h or 'name' in h), 0)
                qty_idx = next((i for i, h in enumerate(header) if 'qty' in h or 'quantity' in h or 'sold' in h or 'count' in h), 1)
                price_idx = next((i for i, h in enumerate(header) if 'price' in h or 'amount' in h or 'total' in h or 'cost' in h), -1)

                for row in table[1:]:
                    if not row or len(row) <= name_idx:
                        continue
                    item_name = str(row[name_idx] or '').strip()
                    qty_str = str(row[qty_idx] if len(row) > qty_idx else '1').strip()
                    price_str = str(row[price_idx] if price_idx >= 0 and len(row) > price_idx else '0').strip()

                    # Extract digits
                    qty_match = re.search(r'\d+', qty_str)
                    qty = int(qty_match.group(0)) if qty_match else 0

                    price_match = re.search(r'[\d\.]+', price_str.replace(',', ''))
                    price = float(price_match.group(0)) if price_match else 0.0

                    if item_name and qty > 0:
                        rows.append({
                            'Item Name': item_name,
                            'Qty Sold': qty,
                            'Unit Price': price,
                            'Total Sales': round(qty * price, 2)
                        })

            # 2. Fallback to raw text line parsing if no structured table extracted
            if not rows:
                text = page.extract_text() or ''
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    # Look for lines ending with numbers (typical invoice / sales format: Item Name Qty Price)
                    match = re.search(r'^(.*?)\s+(\d+)\s+[\$]?([\d\.]+)$', line)
                    if match:
                        item_name, qty_str, price_str = match.groups()
                        rows.append({
                            'Item Name': item_name.strip(),
                            'Qty Sold': int(qty_str),
                            'Unit Price': float(price_str),
                            'Total Sales': round(int(qty_str) * float(price_str), 2)
                        })

    if not rows:
        print("Warning: Could not extract structured rows automatically from PDF.")
        df = pd.DataFrame(columns=['Item Name', 'Qty Sold', 'Unit Price', 'Total Sales'])
    else:
        df = pd.DataFrame(rows)

    output_file = pdf_path.rsplit('.', 1)[0] + ('.xlsx' if output_format == 'excel' else '.csv')
    if output_format == 'excel':
        df.to_excel(output_file, index=False)
    else:
        df.to_csv(output_file, index=False)

    print(f"Successfully converted PDF to {output_file} with {len(rows)} item records.")
    return output_file

if __name__ == '__main__':
    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]
        fmt = sys.argv[2] if len(sys.argv) > 2 else 'csv'
        parse_pdf_to_excel_or_csv(pdf_file, fmt)
    else:
        print("Usage: python parse_pdf_sales.py <path_to_pdf_file> [csv|excel]")
