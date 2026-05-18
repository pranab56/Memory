import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucketName = process.env.SUPABASE_BUCKET || 'media';

export const supabase = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

let bucketChecked = false;

/**
 * Ensures that the bucket exists and is public.
 */
async function ensureBucketExists() {
  if (!supabase || bucketChecked) return;
  
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing Supabase buckets:', listError);
      return;
    }
    
    const exists = buckets.some((b) => b.name === bucketName);
    if (!exists) {
      console.log(`Bucket "${bucketName}" not found. Creating it programmatically...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 1024, // 1GB limit
      });
      if (createError) {
        console.error(`Failed to create bucket "${bucketName}":`, createError);
      } else {
        console.log(`Bucket "${bucketName}" successfully created as a public bucket!`);
        bucketChecked = true;
      }
    } else {
      bucketChecked = true;
    }
  } catch (err) {
    console.error('Failed to ensure bucket exists:', err);
  }
}

/**
 * Uploads a file buffer or ArrayBuffer to Supabase Storage and returns the public URL.
 */
export async function uploadToSupabase(
  fileBuffer: Buffer | ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  await ensureBucketExists();

  const isImage = mimeType.startsWith('image/');
  const folder = isImage ? 'images' : 'videos';
  
  // Extract extension safely
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
  const cleanBase = parts.join('.').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  
  // Generate a clean, unique filename
  const uniqueName = `${cleanBase}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext ? `.${ext}` : ''}`;
  const filePath = `${folder}/${uniqueName}`;

  console.log(`Uploading to Supabase: ${filePath} (${mimeType})`);

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error details:', error);
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}

/**
 * Deletes a file from Supabase Storage given its public URL or relative path.
 */
export async function deleteFromSupabase(fileUrlOrPath: string): Promise<void> {
  if (!supabase) return;

  let filePath = fileUrlOrPath;

  // If a full public URL is passed, extract the relative path in the bucket
  // Example URL: https://xxx.supabase.co/storage/v1/object/public/media/images/filename.png
  if (fileUrlOrPath.startsWith('http')) {
    try {
      const urlPattern = `/storage/v1/object/public/${bucketName}/`;
      const index = fileUrlOrPath.indexOf(urlPattern);
      if (index !== -1) {
        filePath = fileUrlOrPath.substring(index + urlPattern.length);
      } else {
        // Fallback for custom domains or different URL structures
        const parts = fileUrlOrPath.split(`/public/${bucketName}/`);
        if (parts.length > 1) {
          filePath = parts[1];
        }
      }
    } catch (err) {
      console.error('Error parsing Supabase file URL for deletion:', err);
    }
  }

  console.log(`Deleting file from Supabase storage bucket "${bucketName}": ${filePath}`);
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error(`Failed to delete file from Supabase: ${error.message}`);
  } else {
    console.log(`File deleted successfully from Supabase: ${filePath}`);
  }
}
