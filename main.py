import src.init_spark as init_spark
from src.analysis import (
    basic_stats,
    top_active_accounts,
    retweet_analysis,
    content_analysis,
    temporal_analysis,
    coordinated_behavior,
    network_analysis,
    export_summary
)

if __name__ == "__main__":
    df = init_spark.init()
    
    basic_stats(df)
    top_active_accounts(df)
    retweet_analysis(df)
    content_analysis(df)
    # temporal_analysis(df)  # deactivated - corrupted data in publish_date
    coordinated_behavior(df)
    # network_analysis(df)  # deactivated - corrupted data in followers/following
    
    export_summary(df)