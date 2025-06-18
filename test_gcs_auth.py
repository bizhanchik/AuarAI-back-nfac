#!/usr/bin/env python3
"""
Test script to validate Google Cloud Storage authentication
"""
import os
import json
from google.cloud import storage
from google.oauth2 import service_account
from google.cloud.exceptions import GoogleCloudError

def test_gcs_authentication():
    """Test GCS authentication with different methods"""
    
    print("=== Testing Google Cloud Storage Authentication ===\n")
    
    # Test 1: Check if files exist
    print("1. Checking credential files...")
    files_to_check = [
        "auarai-463107-59d3b689d0f8.json",
        "gcs-key.json"
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            print(f"   ✅ {file_path} exists")
            # Validate JSON format
            try:
                with open(file_path, 'r') as f:
                    creds_data = json.load(f)
                    print(f"   ✅ {file_path} is valid JSON")
                    print(f"   📧 Service account email: {creds_data.get('client_email', 'NOT FOUND')}")
                    print(f"   🆔 Project ID: {creds_data.get('project_id', 'NOT FOUND')}")
            except json.JSONDecodeError as e:
                print(f"   ❌ {file_path} contains invalid JSON: {e}")
            except Exception as e:
                print(f"   ❌ Error reading {file_path}: {e}")
        else:
            print(f"   ❌ {file_path} does not exist")
    
    print()
    
    # Test 2: Test direct credential loading
    print("2. Testing credential loading...")
    credential_file = "auarai-463107-59d3b689d0f8.json"
    
    try:
        credentials = service_account.Credentials.from_service_account_file(
            credential_file,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        print(f"   ✅ Successfully loaded credentials from {credential_file}")
        print(f"   📧 Service account: {credentials.service_account_email}")
        print(f"   🆔 Project ID: {credentials.project_id}")
    except Exception as e:
        print(f"   ❌ Failed to load credentials: {e}")
        return False
    
    print()
    
    # Test 3: Test GCS client initialization
    print("3. Testing GCS client initialization...")
    try:
        client = storage.Client(credentials=credentials)
        print("   ✅ GCS client initialized successfully")
    except Exception as e:
        print(f"   ❌ Failed to initialize GCS client: {e}")
        return False
    
    print()
    
    # Test 4: Test bucket access
    print("4. Testing bucket access...")
    bucket_name = "auarai-user-photos"
    
    try:
        bucket = client.bucket(bucket_name)
        if bucket.exists():
            print(f"   ✅ Bucket '{bucket_name}' exists and is accessible")
            
            # Test bucket permissions
            try:
                # Try to list a few objects to test read permissions
                objects = list(bucket.list_blobs(max_results=1))
                print("   ✅ Can list bucket contents")
            except Exception as e:
                print(f"   ⚠️  Cannot list bucket contents: {e}")
            
            # Test creating a simple test object
            try:
                test_blob = bucket.blob("test/auth_test.txt")
                test_blob.upload_from_string("Authentication test successful!")
                print("   ✅ Can upload to bucket")
                
                # Clean up test file
                try:
                    test_blob.delete()
                    print("   ✅ Can delete from bucket")
                except:
                    pass
                    
            except Exception as e:
                print(f"   ❌ Cannot upload to bucket: {e}")
                return False
                
        else:
            print(f"   ❌ Bucket '{bucket_name}' does not exist or is not accessible")
            return False
    except Exception as e:
        print(f"   ❌ Error accessing bucket: {e}")
        return False
    
    print()
    
    # Test 5: Environment variables
    print("5. Checking environment variables...")
    env_vars = {
        'GOOGLE_APPLICATION_CREDENTIALS': os.getenv('GOOGLE_APPLICATION_CREDENTIALS'),
        'GCS_CREDENTIALS_PATH': os.getenv('GCS_CREDENTIALS_PATH'),
        'GCS_BUCKET_NAME': os.getenv('GCS_BUCKET_NAME')
    }
    
    for var, value in env_vars.items():
        if value:
            print(f"   ✅ {var} = {value}")
        else:
            print(f"   ⚠️  {var} not set")
    
    print("\n=== Authentication Test Complete ===")
    print("✅ All tests passed! Your GCS authentication should work.")
    return True

if __name__ == "__main__":
    try:
        success = test_gcs_authentication()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1) 