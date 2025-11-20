import src.init_spark as init_spark
from src.analysis import (
    basic_stats,
    top_active_accounts,
    retweet_analysis,
    content_analysis,
    coordinated_behavior,
    export_summary
)

if __name__ == "__main__":
    dataframe = init_spark.init()

    basic_stats(dataframe)
    top_active_accounts(dataframe)
    retweet_analysis(dataframe)
    content_analysis(dataframe)
    coordinated_behavior(dataframe)
    export_summary(dataframe)

    # Network analysis is done separately after Spark, because we had serialization issues :-(
    print("Generating network analysis...")
    try:
        from src.network_viz import network_analysis_improved
        network_analysis_improved(dataframe)
    except Exception as e:
        print(f"Network analysis failed: {e}")
