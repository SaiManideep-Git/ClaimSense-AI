import os
import json
import random
from PIL import Image, ImageDraw, ImageFont

# Path configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_CASES_PATH = os.path.join(BASE_DIR, 'server', 'test_cases.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'samples')
CLIENT_OUTPUT_DIR = os.path.join(BASE_DIR, 'client', 'public', 'samples')

# Ensure output directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CLIENT_OUTPUT_DIR, exist_ok=True)

# Font configurations (standard Windows fonts path)
WIN_FONTS_DIR = os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts')
FONT_ARIAL = os.path.join(WIN_FONTS_DIR, 'arial.ttf')
FONT_ARIAL_BOLD = os.path.join(WIN_FONTS_DIR, 'arialbd.ttf')
FONT_COURIER = os.path.join(WIN_FONTS_DIR, 'cour.ttf')
FONT_COURIER_BOLD = os.path.join(WIN_FONTS_DIR, 'courbd.ttf')
FONT_TIMES = os.path.join(WIN_FONTS_DIR, 'times.ttf')
FONT_TIMES_BOLD = os.path.join(WIN_FONTS_DIR, 'timesbd.ttf')

def get_font(font_path, size):
    try:
        if os.path.exists(font_path):
            return ImageFont.truetype(font_path, size)
    except Exception:
        pass
    return ImageFont.load_default()

def draw_stamp(draw, text, box_coords, color=(220, 38, 38)):
    # Draw a rotated clinic stamp rectangle
    x_start, y_start, x_end, y_end = box_coords
    
    # We create a separate transparent image, draw the stamp, rotate it, and paste it back
    w = x_end - x_start
    h = y_end - y_start
    stamp_img = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    stamp_draw = ImageDraw.Draw(stamp_img)
    
    # Draw border
    stamp_draw.rectangle([0, 0, w-1, h-1], outline=color, width=3)
    
    # Draw text
    font = get_font(FONT_ARIAL_BOLD, 12)
    # Estimate text length to center it
    text_w = len(text) * 7
    stamp_draw.text(((w - text_w) // 2, (h - 15) // 2), text, fill=color, font=font)
    
    # Rotate stamp
    rotated = stamp_img.rotate(random.randint(-15, 15), expand=True, resample=Image.Resampling.BICUBIC)
    return rotated

def draw_signature(draw, start_coords, color=(37, 99, 235)):
    # Draw a realistic doctor's signature (connecting wavy lines)
    x, y = start_coords
    points = [
        (x, y), 
        (x + 15, y - 20), 
        (x + 30, y + 10), 
        (x + 45, y - 10), 
        (x + 60, y + 5), 
        (x + 80, y - 5),
        (x + 100, y + 2)
    ]
    # Draw loops
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=color, width=2)
    
    # Underline
    draw.line([(x - 10, y + 15), (x + 110, y + 12)], fill=color, width=2)

def generate_prescription(tc_id, tc_name, input_data):
    doc = input_data.get('documents', {}).get('prescription')
    if not doc:
        print(f"Skipping prescription for {tc_id} (not specified in test cases)")
        return
        
    print(f"Generating prescription image for {tc_id} ({tc_name})...")
    
    # Create canvas
    img = Image.new('RGB', (800, 1100), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer Border (clinic letterhead style)
    draw.rectangle([10, 10, 790, 1090], outline=(15, 23, 42), width=3)
    draw.rectangle([15, 15, 785, 1085], outline=(14, 116, 144), width=1) # cyan line
    
    # Header Hospital/Doctor Info
    doc_name = doc.get('doctor_name', 'Dr. Medical Practitioner')
    doc_reg = doc.get('doctor_reg', 'REG-123456/2018')
    hospital = input_data.get('hospital') or 'Care Clinic & General OPD'
    
    font_h1 = get_font(FONT_ARIAL_BOLD, 26)
    font_h2 = get_font(FONT_ARIAL_BOLD, 14)
    font_h3 = get_font(FONT_ARIAL, 12)
    font_body = get_font(FONT_TIMES, 15)
    font_body_bold = get_font(FONT_TIMES_BOLD, 15)
    font_mono = get_font(FONT_COURIER, 14)
    font_mono_bold = get_font(FONT_COURIER_BOLD, 14)
    
    # Draw Doctor Details Left-aligned
    draw.text((60, 60), doc_name.upper(), fill=(15, 23, 42), font=font_h1)
    draw.text((60, 95), f"Reg. No: {doc_reg}", fill=(71, 85, 105), font=font_h2)
    draw.text((60, 115), "MBBS, MD - General Medicine", fill=(71, 85, 105), font=font_h3)
    
    # Clinic info Right-aligned
    draw.text((500, 60), hospital, fill=(14, 116, 144), font=font_h2)
    draw.text((500, 80), "24, MG Road, Health City", fill=(100, 116, 139), font=font_h3)
    draw.text((500, 95), "Phone: 080-4567-8910", fill=(100, 116, 139), font=font_h3)
    
    # Horizontal Rule
    draw.line([50, 145, 750, 145], fill=(203, 213, 225), width=2)
    
    # Date
    draw.text((580, 160), f"Date: {input_data['treatment_date']}", fill=(71, 85, 105), font=font_mono_bold)
    
    # Patient Details Block
    draw.text((60, 190), f"Patient Name:  {input_data['member_name']}", fill=(15, 23, 42), font=font_body_bold)
    draw.text((60, 215), f"Member ID:     {input_data['member_id']}", fill=(15, 23, 42), font=font_body)
    draw.text((450, 190), "Age/Sex:  34 Yrs / M", fill=(15, 23, 42), font=font_body)
    
    # Second Horizontal Rule
    draw.line([50, 250, 750, 250], fill=(203, 213, 225), width=1)
    
    # Chief Complaints
    draw.text((60, 275), "Chief Complaints:", fill=(14, 116, 144), font=font_h2)
    draw.text((60, 295), f"- Patient complains of acute symptoms related to {doc.get('diagnosis', 'consultation')}.", fill=(51, 65, 85), font=font_body)
    draw.text((60, 312), "- Symptoms duration: 3 days.", fill=(51, 65, 85), font=font_body)
    
    # Diagnosis
    draw.text((60, 350), "Diagnosis / Clinical Assessment:", fill=(14, 116, 144), font=font_h2)
    draw.text((60, 372), doc.get('diagnosis', 'General Consultation / Healthy checkup'), fill=(15, 23, 42), font=font_body_bold)
    
    # Rx Symbol (Georgia style large text)
    font_rx = get_font(FONT_TIMES_BOLD, 48)
    draw.text((60, 420), "Rx", fill=(14, 116, 144), font=font_rx)
    
    # Prescribed Medicines list
    y_med = 490
    medicines = doc.get('medicines_prescribed')
    if medicines:
        draw.text((60, y_med), "Medicines Prescribed:", fill=(15, 23, 42), font=font_h2)
        y_med += 25
        for idx, med in enumerate(medicines):
            draw.text((80, y_med), f"{idx + 1}.  {med}", fill=(15, 23, 42), font=font_mono_bold)
            draw.text((80, y_med + 18), "    Dosage: 1 Tablet - Morning & Night after meals x 5 Days", fill=(100, 116, 139), font=font_mono)
            y_med += 40
            
    # Diagnostic Tests advised
    tests = doc.get('tests_prescribed')
    if tests:
        y_med += 15
        draw.text((60, y_med), "Diagnostic Investigations Advised:", fill=(15, 23, 42), font=font_h2)
        y_med += 25
        for test in tests:
            draw.text((80, y_med), f"•  {test}", fill=(15, 23, 42), font=font_mono_bold)
            y_med += 22
            
    # Procedures / Treatment
    procedures = doc.get('procedures')
    treatment = doc.get('treatment')
    if procedures or treatment:
        y_med += 15
        draw.text((60, y_med), "Procedures & Therapy Scheduled:", fill=(15, 23, 42), font=font_h2)
        y_med += 25
        if procedures:
            for proc in procedures:
                draw.text((80, y_med), f"-  {proc}", fill=(15, 23, 42), font=font_mono_bold)
                y_med += 22
        if treatment:
            draw.text((80, y_med), f"-  {treatment}", fill=(15, 23, 42), font=font_mono_bold)
            y_med += 22

    # Draw Clinic stamp in bottom-left
    stamp_img = draw_stamp(img, f"DR. {doc_name.split()[-1].upper()} clinic", (80, 930, 260, 980))
    img.paste(stamp_img, (80, 910), stamp_img)
    
    # Signature line in bottom-right
    draw.text((500, 910), "Authorized Signatory", fill=(100, 116, 139), font=font_h3)
    draw_signature(draw, (500, 950))
    draw.text((500, 980), "Medical Practitioner Signature", fill=(71, 85, 105), font=font_h3)
    
    # Save Image
    filename = f"{tc_id}_Prescription.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, 'PNG')
    client_filepath = os.path.join(CLIENT_OUTPUT_DIR, filename)
    img.save(client_filepath, 'PNG')
    print(f"Saved: {filepath} and {client_filepath}")

def generate_bill(tc_id, tc_name, input_data):
    doc = input_data.get('documents', {}).get('bill')
    if not doc:
        print(f"Skipping bill for {tc_id} (not specified in test cases)")
        return
        
    print(f"Generating bill image for {tc_id} ({tc_name})...")
    
    # Create canvas
    img = Image.new('RGB', (800, 1100), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer Border (bill letterhead style)
    draw.rectangle([10, 10, 790, 1090], outline=(15, 23, 42), width=3)
    draw.rectangle([15, 15, 785, 1085], outline=(220, 38, 38), width=1) # Red accent line
    
    font_h1 = get_font(FONT_ARIAL_BOLD, 24)
    font_h2 = get_font(FONT_ARIAL_BOLD, 13)
    font_h3 = get_font(FONT_ARIAL, 11)
    font_body = get_font(FONT_TIMES, 15)
    font_body_bold = get_font(FONT_TIMES_BOLD, 15)
    font_mono = get_font(FONT_COURIER, 14)
    font_mono_bold = get_font(FONT_COURIER_BOLD, 14)
    
    hospital = input_data.get('hospital') or 'Care Clinic & OPD Hub'
    
    # Header: Hospital Name
    draw.text((60, 60), hospital.upper(), fill=(15, 23, 42), font=font_h1)
    draw.text((60, 92), "Tax Invoice / Patient Bill Statement", fill=(71, 85, 105), font=font_h2)
    draw.text((60, 108), "GSTIN: 29AAAAA1111A1Z1", fill=(100, 116, 139), font=font_h3)
    
    # Hospital Info Right-aligned
    draw.text((500, 60), "OPD Billing Desk, 1st Floor", fill=(15, 23, 42), font=font_h2)
    draw.text((500, 78), "24, MG Road, Health City", fill=(100, 116, 139), font=font_h3)
    draw.text((500, 93), "GST Invoice No: GST-998811", fill=(71, 85, 105), font=font_h2)
    
    # Horizontal Rule
    draw.line([50, 140, 750, 140], fill=(203, 213, 225), width=2)
    
    # Bill Details
    draw.text((60, 160), f"Patient Name:  {input_data['member_name']}", fill=(15, 23, 42), font=font_body_bold)
    draw.text((60, 182), f"Member ID:     {input_data['member_id']}", fill=(15, 23, 42), font=font_body)
    draw.text((500, 160), f"Bill Date:  {input_data['treatment_date']}", fill=(15, 23, 42), font=font_mono_bold)
    draw.text((500, 182), f"Ref Doctor: {input_data.get('documents', {}).get('prescription', {}).get('doctor_name', 'Dr. Staff')}", fill=(15, 23, 42), font=font_body)
    
    # Second Horizontal Rule
    draw.line([50, 220, 750, 220], fill=(203, 213, 225), width=1)
    
    # Table Header Box
    draw.rectangle([50, 240, 750, 275], fill=(248, 250, 252), outline=(203, 213, 225), width=1)
    draw.text((70, 250), "PARTICULARS / SERVICES INGESTED", fill=(15, 23, 42), font=font_h2)
    draw.text((600, 250), "AMOUNT (INR)", fill=(15, 23, 42), font=font_h2)
    
    # Render table lines dynamically
    y_row = 300
    subtotal = 0
    
    for key, value in doc.items():
        if isinstance(value, (int, float)):
            # Form description key: root_canal -> Root Canal
            desc = key.replace('_', ' ').title()
            draw.text((70, y_row), desc, fill=(51, 65, 85), font=font_mono_bold)
            draw.text((600, y_row), f"₹ {float(value):.2f}", fill=(15, 23, 42), font=font_mono)
            subtotal += value
            y_row += 40
            
            # Line separator
            draw.line([50, y_row - 15, 750, y_row - 15], fill=(241, 245, 249), width=1)
            
        elif isinstance(value, list):
            # If it's a test list, itemize
            for item in value:
                item_amount = 250.0  # mock split cost
                draw.text((70, y_row), f"Diagnostic Test: {item}", fill=(51, 65, 85), font=font_mono_bold)
                draw.text((600, y_row), f"₹ {item_amount:.2f}", fill=(15, 23, 42), font=font_mono)
                subtotal += item_amount
                y_row += 40
                
                # Line separator
                draw.line([50, y_row - 15, 750, y_row - 15], fill=(241, 245, 249), width=1)
                
    # If no items were parsed (fallback OPD consultation)
    if subtotal == 0:
        consultation_fee = input_data['claim_amount']
        draw.text((70, y_row), "General OPD Consultation Fee", fill=(51, 65, 85), font=font_mono_bold)
        draw.text((600, y_row), f"₹ {float(consultation_fee):.2f}", fill=(15, 23, 42), font=font_mono)
        subtotal = consultation_fee
        y_row += 40
        draw.line([50, y_row - 15, 750, y_row - 15], fill=(241, 245, 249), width=1)

    # Totals Box
    y_row += 10
    draw.line([50, y_row, 750, y_row], fill=(15, 23, 42), width=2)
    
    y_row += 15
    draw.text((380, y_row), "Subtotal Amount:", fill=(71, 85, 105), font=font_body_bold)
    draw.text((600, y_row), f"₹ {subtotal:.2f}", fill=(15, 23, 42), font=font_mono_bold)
    
    y_row += 25
    gst = subtotal * 0.18
    draw.text((380, y_row), "CGST (9%) + SGST (9%):", fill=(71, 85, 105), font=font_body)
    draw.text((600, y_row), f"₹ {gst:.2f}", fill=(15, 23, 42), font=font_mono)
    
    y_row += 30
    draw.rectangle([350, y_row - 5, 750, y_row + 30], fill=(254, 242, 242), outline=(220, 38, 38), width=1) # Red highlight for total
    draw.text((380, y_row + 5), "NET PAYABLE TOTAL:", fill=(220, 38, 38), font=font_h2)
    draw.text((600, y_row + 5), f"₹ {input_data['claim_amount']:.2f}", fill=(220, 38, 38), font=font_mono_bold)
    
    # Stamp & Signature
    stamp_img = draw_stamp(img, "PAID - HEALTH DESK", (80, 930, 260, 980), color=(16, 185, 129)) # Green PAID stamp
    img.paste(stamp_img, (80, 910), stamp_img)
    
    draw.text((500, 915), "Billing Officer", fill=(100, 116, 139), font=font_h3)
    draw_signature(draw, (500, 945), color=(15, 23, 42))
    draw.text((500, 975), "Authorized Cashier Stamp", fill=(71, 85, 105), font=font_h3)
    
    # Save Image
    filename = f"{tc_id}_Bill.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, 'PNG')
    client_filepath = os.path.join(CLIENT_OUTPUT_DIR, filename)
    img.save(client_filepath, 'PNG')
    print(f"Saved: {filepath} and {client_filepath}")

def run():
    print(f"Reading test cases definitions from: {TEST_CASES_PATH}")
    with open(TEST_CASES_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    test_cases = data.get('test_cases', [])
    print(f"Found {len(test_cases)} test cases in JSON file.")
    
    for tc in test_cases:
        tc_id = tc['case_id']
        tc_name = tc['case_name']
        input_data = tc['input_data']
        
        # 1. Generate prescription if present
        generate_prescription(tc_id, tc_name, input_data)
        
        # 2. Generate bill if present
        generate_bill(tc_id, tc_name, input_data)
        
    print("\n[SUCCESS] ALL MOCK DOCUMENTS GENERATED SUCCESSFUL!")
    print(f"Check the output folder: {OUTPUT_DIR}")

if __name__ == '__main__':
    run()
