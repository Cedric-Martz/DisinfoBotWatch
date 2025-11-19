from pyspark.sql import DataFrame
from pyspark.sql.functions import (
    col, count, countDistinct, desc, asc, avg, sum, min, max,
    when, hour, to_timestamp, explode, split, lower, regexp_extract,
    length, datediff, unix_timestamp, lag, row_number
)
from pyspark.sql.window import Window
from pyspark.sql.functions import to_timestamp as try_to_timestamp_func


def basic_stats(df: DataFrame):
    total_tweets = df.count()
    unique_authors = df.select("author").distinct().count()
    unique_accounts = df.select("external_author_id").distinct().count()
    
    print(f"Total tweets: {total_tweets:,}")
    print(f"Unique authors: {unique_authors:,}")
    print(f"Unique accounts (IDs): {unique_accounts:,}")
    print()
    
    print("Distribution by account type:")
    df.groupBy("account_type").count() \
        .orderBy(desc("count")) \
        .show(truncate=False)
    
    print("Distribution by category:")
    df.groupBy("account_category").count() \
        .orderBy(desc("count")) \
        .show(truncate=False)
    
    print("Distribution by region (top 10):")
    df.groupBy("region").count() \
        .orderBy(desc("count")) \
        .show(10, truncate=False)
    
    print("Distribution by language:")
    df.groupBy("language").count() \
        .orderBy(desc("count")) \
        .show(truncate=False)


def top_active_accounts(df: DataFrame, n=20):
    print(f"Top {n} most active accounts:")
    df.groupBy("author", "account_type", "account_category") \
        .agg(count("*").alias("tweet_count")) \
        .orderBy(desc("tweet_count")) \
        .show(n, truncate=False)


def retweet_analysis(df: DataFrame):
    print("tweets/retweets ratio by account (top 20):")
    df.groupBy("author") \
        .agg(
            count("*").alias("total_tweets"),
            sum(when(col("retweet") == "1", 1).otherwise(0)).alias("retweets"),
            sum(when(col("retweet") == "0", 1).otherwise(0)).alias("original_tweets")
        ) \
        .withColumn("retweet_ratio", col("retweets") / col("total_tweets")) \
        .orderBy(desc("total_tweets")) \
        .show(20, truncate=False)
    
    # global stats
    total = df.count()
    retweets = df.filter(col("retweet") == "1").count()
    originals = df.filter(col("retweet") == "0").count()
    
    print(f"\nGlobal: {retweets:,} retweets ({retweets/total*100:.1f}%) vs {originals:,} originals ({originals/total*100:.1f}%)")
    print()


def content_analysis(df: DataFrame):
    print("Content length statistics:")
    df.withColumn("content_length", length(col("content"))) \
        .select(
            avg("content_length").alias("avg_length"),
            min("content_length").alias("min_length"),
            max("content_length").alias("max_length")
        ) \
        .show(truncate=False)
    
    print("Duplicated content (top 10 identical tweets):")
    df.groupBy("content") \
        .agg(
            count("*").alias("occurrences"),
            countDistinct("author").alias("unique_authors")
        ) \
        .filter(col("occurrences") > 1) \
        .orderBy(desc("occurrences")) \
        .show(10, truncate=80)


def temporal_analysis(df: DataFrame):
    df_with_time = df.withColumn(
        "timestamp",
        try_to_timestamp_func(col("publish_date"), "M/d/yyyy H:mm")
    ).filter(col("timestamp").isNotNull())
    
    df_with_time = df_with_time.withColumn(
        "date",
        col("timestamp").cast("date")
    )
    
    print("Tweet distribution by day (top 20):")
    df_with_time.groupBy("date") \
        .count() \
        .orderBy(desc("count")) \
        .show(20, truncate=False)
    
    df_with_time = df_with_time.withColumn(
        "hour_of_day",
        hour(col("timestamp"))
    )
    
    print("Tweet distribution by hour of day:")
    df_with_time.groupBy("hour_of_day") \
        .count() \
        .orderBy("hour_of_day") \
        .show(24, truncate=False)


def coordinated_behavior(df: DataFrame):
    print("Identical tweets posted by multiple different accounts (top 10):")
    df.groupBy("content", "publish_date") \
        .agg(
            countDistinct("author").alias("unique_authors"),
            count("*").alias("total_posts")
        ) \
        .filter(col("unique_authors") > 3) \
        .orderBy(desc("unique_authors")) \
        .show(10, truncate=80)


def network_analysis(df: DataFrame):
    print("Top 20 accounts with the most followers:")
    df.select("author", "followers", "following", "updates", "account_type") \
        .distinct() \
        .filter(col("followers").cast("int").isNotNull()) \
        .withColumn("followers_int", col("followers").cast("int")) \
        .withColumn("following_int", col("following").cast("int")) \
        .withColumn("ratio", col("followers_int") / (col("following_int") + 1)) \
        .orderBy(desc("followers_int")) \
        .show(20, truncate=False)

# Export short summary of analysis results
def export_summary(df: DataFrame, output_dir="outputs"):
    df.groupBy("author", "account_type", "account_category") \
        .agg(count("*").alias("tweet_count")) \
        .orderBy(desc("tweet_count")) \
        .coalesce(1) \
        .write.csv(f"{output_dir}/top_active_accounts.csv", header=True, mode="overwrite")
    
    df.groupBy("account_type", "account_category") \
        .count() \
        .orderBy(desc("count")) \
        .coalesce(1) \
        .write.csv(f"{output_dir}/account_distribution.csv", header=True, mode="overwrite")
