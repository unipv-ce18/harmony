resource "aws_sns_topic" "s3_notification" {
  name = "BucketNotification"
}

resource "aws_sns_topic_policy" "s3_notification_policy" {
  arn    = aws_sns_topic.s3_notification.arn
  policy = data.aws_iam_policy_document.s3_topic_policy.json
}

data "aws_iam_policy_document" "s3_topic_policy" {
  policy_id = "s3-access"
  statement {
    sid       = "s3-access-statement"
    effect    = "Allow"
    actions   = ["SNS:Publish"]
    resources = [aws_sns_topic.s3_notification.arn]
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values = [
        aws_s3_bucket.songs_reference.arn,
        aws_s3_bucket.images.arn
      ]
    }
  }
}

resource "aws_s3_bucket_notification" "create_songs" {
  bucket = aws_s3_bucket.songs_reference.id

  topic {
    id        = "NotifyCreated"
    topic_arn = aws_sns_topic.s3_notification.arn
    events    = ["s3:ObjectCreated:*"]
  }
}

resource "aws_s3_bucket_notification" "create_images" {
  bucket = aws_s3_bucket.images.id

  topic {
    id        = "NotifyCreated"
    topic_arn = aws_sns_topic.s3_notification.arn
    events    = ["s3:ObjectCreated:*"]
  }
}


# TODO: Add subscription once we have a domain
