# CloudFront Origin Access Control for Photos bucket
resource "aws_cloudfront_origin_access_control" "photos_oac" {
  name                              = "${var.project_name}-photos-oac-${var.environment}"
  description                       = "OAC for Photos S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Origin Access Control for Thumbnails bucket
resource "aws_cloudfront_origin_access_control" "thumbnails_oac" {
  name                              = "${var.project_name}-thumbnails-oac-${var.environment}"
  description                       = "OAC for Thumbnails S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution for Image Delivery
resource "aws_cloudfront_distribution" "images" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN for ${var.project_name} images"
  price_class         = "PriceClass_100" # North America and Europe only

  # Origin for original photos
  origin {
    domain_name              = aws_s3_bucket.photos.bucket_regional_domain_name
    origin_id                = "S3-photos"
    origin_access_control_id = aws_cloudfront_origin_access_control.photos_oac.id
  }

  # Origin for thumbnails
  origin {
    domain_name              = aws_s3_bucket.thumbnails.bucket_regional_domain_name
    origin_id                = "S3-thumbnails"
    origin_access_control_id = aws_cloudfront_origin_access_control.thumbnails_oac.id
  }

  # Default cache behavior (for original photos)
  default_cache_behavior {
    target_origin_id       = "S3-photos"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = aws_cloudfront_cache_policy.images_cache_policy.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3.id
  }

  # Cache behavior for thumbnails
  ordered_cache_behavior {
    path_pattern           = "*/thumbnails/*"
    target_origin_id       = "S3-thumbnails"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = aws_cloudfront_cache_policy.images_cache_policy.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name        = "Images CDN"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Custom cache policy for images - 1 year TTL
resource "aws_cloudfront_cache_policy" "images_cache_policy" {
  name        = "${var.project_name}-images-cache-${var.environment}"
  comment     = "Cache policy for image assets with 1 year TTL"
  default_ttl = 31536000 # 1 year
  max_ttl     = 31536000 # 1 year
  min_ttl     = 86400    # 1 day

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Use AWS managed CORS-S3 origin request policy
data "aws_cloudfront_origin_request_policy" "cors_s3" {
  name = "Managed-CORS-S3Origin"
}

# S3 bucket policy for photos - allow CloudFront OAC access
resource "aws_s3_bucket_policy" "photos_cloudfront" {
  bucket = aws_s3_bucket.photos.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.photos.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.images.arn
          }
        }
      }
    ]
  })
}

# S3 bucket policy for thumbnails - allow CloudFront OAC access
resource "aws_s3_bucket_policy" "thumbnails_cloudfront" {
  bucket = aws_s3_bucket.thumbnails.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.thumbnails.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.images.arn
          }
        }
      }
    ]
  })
}
