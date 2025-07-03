#!/usr/bin/env python3
"""
Test the new service account key
"""
import os
import uuid
from google.cloud import storage
from google.oauth2 import service_account

def test_new_key():
    """Test the new service account key"""
    
    print("=== Testing New Service Account Key ===\n")
    
    credentials_file = "firebase-service-account.json"
    bucket_name = "auarai-user-photos"
    
    try:
        print("1. Loading new credentials...")
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        print(f"   ✅ Credentials loaded")
        print(f"   📧 Service account: {credentials.service_account_email}")
        print(f"   🆔 Project ID: {credentials.project_id}")
        
        print("\n2. Creating GCS client...")
        client = storage.Client(credentials=credentials)
        print("   ✅ Client created")
        
        print("3. Testing bucket access...")
        bucket = client.bucket(bucket_name)
        print("   ✅ Bucket reference created")
        
        print("4. Creating test upload...")
        test_filename = f"test_{uuid.uuid4()}.txt"
        test_content = f"New key test - {uuid.uuid4()}"
        blob = bucket.blob(f"test/{test_filename}")
        
        print("5. Uploading test file...")
        blob.upload_from_string(
            test_content,
            content_type='text/plain'
        )
        print("   ✅ File uploaded successfully!")
        
        print("6. Generating public URL...")
        public_url = f"https://storage.googleapis.com/{bucket_name}/test/{test_filename}"
        print(f"   ✅ Public URL: {public_url}")
        
        print("7. Testing file deletion...")
        blob.delete()
        print("   ✅ File deleted successfully")
        
        print("\n🎉 SUCCESS: New service account key works perfectly!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        return False

if __name__ == "__main__":
    success = test_new_key()
    exit(0 if success else 1) 