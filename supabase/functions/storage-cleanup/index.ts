import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  bucketName: string;
  totalFiles: number;
  referencedFiles: number;
  orphanedFiles: number;
  deletedFiles: number;
  spaceFreed: string;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { buckets, dryRun = true } = await req.json();
    const bucketsToClean = buckets || ['motivator-images', 'website-images', 'food-images', 'background-images', 'blog-images'];
    
    console.log(`🧹 Starting storage cleanup for buckets: ${bucketsToClean.join(', ')}`);
    console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no files will be deleted)' : 'LIVE CLEANUP'}`);

    // Step 1: Get all referenced images from database
    console.log('📊 Fetching all referenced images from database...');
    const { data: referencedImages, error: dbError } = await supabaseClient
      .rpc('get_all_referenced_images');

    if (dbError) {
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    // Create a set of referenced image URLs for fast lookup
    const referencedUrls = new Set();
    const referencedPaths = new Set();
    
    for (const ref of referencedImages || []) {
      if (ref.image_url) {
        referencedUrls.add(ref.image_url);
        
        // Extract file path from URL for each bucket
        for (const bucket of bucketsToClean) {
          if (ref.image_url.includes(`/${bucket}/`)) {
            const urlParts = ref.image_url.split('/');
            const bucketIndex = urlParts.findIndex(part => part === bucket);
            if (bucketIndex !== -1) {
              const filePath = urlParts.slice(bucketIndex + 1).join('/');
              if (filePath) {
                referencedPaths.add(`${bucket}:${filePath}`);
              }
            }
          }
        }
      }
    }

    console.log(`✅ Found ${referencedUrls.size} referenced images in database`);
    console.log(`🔗 Mapped ${referencedPaths.size} file paths across all buckets`);

    const results: CleanupResult[] = [];

    // Step 2: Process each bucket
    for (const bucketName of bucketsToClean) {
      console.log(`\n🪣 Processing bucket: ${bucketName}`);
      
      const result: CleanupResult = {
        bucketName,
        totalFiles: 0,
        referencedFiles: 0,
        orphanedFiles: 0,
        deletedFiles: 0,
        spaceFreed: '0 MB',
        errors: []
      };

      try {
        // List all files in bucket
        const { data: files, error: listError } = await supabaseClient.storage
          .from(bucketName)
          .list('', {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (listError) {
          result.errors.push(`Failed to list files: ${listError.message}`);
          results.push(result);
          continue;
        }

        if (!files || files.length === 0) {
          console.log(`📭 Bucket ${bucketName} is empty`);
          results.push(result);
          continue;
        }

        result.totalFiles = files.length;
        console.log(`📁 Found ${files.length} files in ${bucketName}`);

        // Step 3: Identify orphaned files
        const orphanedFiles = [];
        const referencedFiles = [];
        let totalSize = 0;

        for (const file of files) {
          const filePath = file.name;
          const fileKey = `${bucketName}:${filePath}`;
          
          // Build potential URLs for this file
          const baseUrl = `https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`;
          
          if (referencedPaths.has(fileKey) || referencedUrls.has(baseUrl)) {
            referencedFiles.push(file);
          } else {
            orphanedFiles.push(file);
            if (file.metadata?.size) {
              totalSize += file.metadata.size;
            }
          }
        }

        result.referencedFiles = referencedFiles.length;
        result.orphanedFiles = orphanedFiles.length;
        result.spaceFreed = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;

        console.log(`✅ Referenced files: ${referencedFiles.length}`);
        console.log(`🗑️ Orphaned files: ${orphanedFiles.length}`);
        console.log(`💾 Space to be freed: ${result.spaceFreed}`);

        // Step 4: Delete orphaned files (if not dry run)
        if (!dryRun && orphanedFiles.length > 0) {
          console.log(`🗑️ Deleting ${orphanedFiles.length} orphaned files...`);
          
          const filesToDelete = orphanedFiles.map(f => f.name);
          const { data: deleteData, error: deleteError } = await supabaseClient.storage
            .from(bucketName)
            .remove(filesToDelete);

          if (deleteError) {
            result.errors.push(`Failed to delete files: ${deleteError.message}`);
          } else {
            result.deletedFiles = filesToDelete.length;
            console.log(`✅ Successfully deleted ${result.deletedFiles} files`);
          }
        } else if (dryRun && orphanedFiles.length > 0) {
          console.log(`🔍 DRY RUN: Would delete ${orphanedFiles.length} files`);
          console.log('Sample orphaned files:');
          orphanedFiles.slice(0, 5).forEach(file => {
            console.log(`  - ${file.name} (${file.metadata?.size ? Math.round(file.metadata.size / 1024) + ' KB' : 'unknown size'})`);
          });
        }

      } catch (error) {
        console.error(`❌ Error processing bucket ${bucketName}:`, error);
        result.errors.push(`Bucket processing failed: ${error.message}`);
      }

      results.push(result);
    }

    // Step 5: Generate summary
    const totalOrphaned = results.reduce((sum, r) => sum + r.orphanedFiles, 0);
    const totalDeleted = results.reduce((sum, r) => sum + r.deletedFiles, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`🗑️ Total orphaned files found: ${totalOrphaned}`);
    console.log(`✅ Total files deleted: ${totalDeleted}`);
    console.log(`❌ Total errors: ${totalErrors}`);

    const response = {
      success: true,
      summary: {
        mode: dryRun ? 'dry_run' : 'live_cleanup',
        bucketsProcessed: bucketsToClean.length,
        totalOrphanedFiles: totalOrphaned,
        totalDeletedFiles: totalDeleted,
        totalErrors,
        referencedImagesInDatabase: referencedUrls.size
      },
      results,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Storage cleanup failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});