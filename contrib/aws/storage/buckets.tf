# --- Buckets ---

resource "aws_s3_bucket" "songs_reference" {
  bucket = var.storage_bucket_songs_reference

  # To allow direct browser access on upload
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
  }
}

resource "aws_s3_bucket" "songs_transcoded" {
  bucket = var.storage_bucket_songs_transcoded

  # To allow direct browser access on js fetch
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
  }
}

resource "aws_s3_bucket" "songs_bundles" {
  bucket = var.storage_bucket_songs_bundles
}

resource "aws_s3_bucket" "images" {
  bucket = var.storage_bucket_images

  # To allow browser image upload
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST"]
    allowed_origins = ["*"]
  }
}


# --- Public access block rules ---

resource "aws_s3_bucket_public_access_block" "songs_transcoded" {
  bucket = aws_s3_bucket.songs_transcoded.id

  # Transcoded songs need public access (by policy)
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "songs_bundles" {
  bucket = aws_s3_bucket.songs_bundles.id

  # Downloadable bundles need public access (by policy)
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  # Images need public access (by policy)
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}


# --- New object ownership ---

resource "aws_s3_bucket_ownership_controls" "songs_transcoded" {
  bucket = aws_s3_bucket.songs_transcoded.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_ownership_controls" "songs_bundles" {
  bucket = aws_s3_bucket.songs_bundles.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_ownership_controls" "images" {
  bucket = aws_s3_bucket.images.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}


# --- Bucket policies ---

resource "aws_s3_bucket_policy" "songs_reference" {
  bucket = aws_s3_bucket.songs_reference.id
  policy = data.aws_iam_policy_document.bucket_songs_reference_policy.json
}

resource "aws_s3_bucket_policy" "songs_transcoded" {
  bucket = aws_s3_bucket.songs_transcoded.id
  policy = data.aws_iam_policy_document.bucket_songs_transcoded_policy.json
}

resource "aws_s3_bucket_policy" "songs_bundles" {
  bucket = aws_s3_bucket.songs_bundles.id
  policy = data.aws_iam_policy_document.bucket_songs_bundles_policy.json
}

resource "aws_s3_bucket_policy" "images" {
  bucket = aws_s3_bucket.images.id
  policy = data.aws_iam_policy_document.bucket_images_policy.json
}


# --- Policy data ---

data "aws_iam_policy_document" "bucket_songs_reference_policy" {
  statement {
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.songs_reference.arn,
      "${aws_s3_bucket.songs_reference.arn}/*"
    ]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.st.arn]
    }
  }
}

data "aws_iam_policy_document" "bucket_songs_transcoded_policy" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.songs_transcoded.arn]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.songs_transcoded.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
  statement {
    sid       = "Only allow writes from application account with bucket owner full control"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.songs_transcoded.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.st.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

data "aws_iam_policy_document" "bucket_songs_bundles_policy" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.songs_bundles.arn]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.songs_bundles.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
  statement {
    sid       = "Only allow writes from application account with bucket owner full control"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.songs_bundles.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.st.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

data "aws_iam_policy_document" "bucket_images_policy" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.images.arn]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.images.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.images.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.st.arn]
    }
    # Enforcing s3:x-amz-acl to bucket-owner-full-control seems not to work with presigned URLs
  }
}
