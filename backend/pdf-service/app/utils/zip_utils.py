import io
import zipfile

def create_zip_from_images(images):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for img in images:
            zip_file.writestr(f"page_{img.page_number}.png", img.image_data)
    zip_buffer.seek(0)
    return zip_buffer
