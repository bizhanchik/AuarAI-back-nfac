#!/usr/bin/env python3
"""
Simple GCS test that bypasses JWT issues for public buckets
"""
import os
import uuid
from io import BytesIO
from google.cloud import storage
from google.oauth2 import service_account

def simple_upload_test():
    """Test upload with minimal authentication"""
    
    print("=== Simple GCS Upload Test ===\n")
    
    # Load credentials
    credentials_file = "auarai-463107-59d3b689d0f8.json"
    bucket_name = "auarai-user-photos"
    
    try:
        # Method 1: Try with explicit credentials
        print("1. Loading credentials...")
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        print("   ✅ Credentials loaded")
        
        print("2. Creating GCS client...")
        client = storage.Client(credentials=credentials)
        print("   ✅ Client created")
        
        print("3. Getting bucket reference...")
        bucket = client.bucket(bucket_name)
        print("   ✅ Bucket reference created")
        
        print("4. Creating test file...")
        test_filename = f"test_{uuid.uuid4()}.txt"
        test_content = "This is a test upload from Python!"
        blob = bucket.blob(f"test/{test_filename}")
        print(f"   ✅ Blob created: test/{test_filename}")
        
        print("5. Uploading file...")
        # Upload directly from string
        blob.upload_from_string(
            test_content,
            content_type='text/plain'
        )
        print("   ✅ File uploaded successfully!")
        
        print("6. Generating public URL...")
        # Since bucket is public, construct URL directly
        public_url = f"https://storage.googleapis.com/{bucket_name}/test/{test_filename}"
        print(f"   ✅ Public URL: {public_url}")
        
        print("7. Cleaning up...")
        try:
            blob.delete()
            print("   ✅ Test file deleted")
        except:
            print("   ⚠️  Could not delete test file")
        
        print("\n✅ SUCCESS: Upload test completed!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        return False

if __name__ == "__main__":
    success = simple_upload_test()
    exit(0 if success else 1) 