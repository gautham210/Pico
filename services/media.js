export async function uploadImage(file) {
  try {
    const rawCloudinaryUrl = import.meta.env.VITE_CLOUDINARY_URL || '';
    
    // Parse cloud name from cloudinary://KEY:SECRET@CLOUD_NAME or use cloud name directly
    let cloudName = '';
    if (rawCloudinaryUrl.includes('@')) {
      cloudName = rawCloudinaryUrl.split('@')[1].trim();
    } else if (rawCloudinaryUrl.startsWith('http')) {
      const match = rawCloudinaryUrl.match(/v1_1\/([^/]+)/);
      if (match) cloudName = match[1];
    } else {
      cloudName = rawCloudinaryUrl.replace('cloudinary://', '').trim();
    }

    if (!cloudName) {
      throw new Error('Cloudinary cloud name could not be resolved from VITE_CLOUDINARY_URL');
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'pico_unsigned');

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url || data.url;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
}
