from pyspark.sql import SparkSession
from pyspark.sql.utils import AnalysisException
import sys

def init():
    spark = SparkSession.builder \
        .appName("DisinfoBotWatch") \
        .config("spark.driver.memory", "4g") \
        .config("spark.executor.memory", "4g") \
        .config("spark.sql.shuffle.partitions", "100") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("ERROR")

    try:
        return spark.read.csv("data/IRAhandle_tweets_*.csv", header=True, inferSchema=True)
    except AnalysisException as csv_read_error:
        print(f"Error: {csv_read_error}")
        print("Maybe you forgot to download datas? Try the following, then try again:")
        print("1. cd data/")
        print("2. vim dl_data.sh # to uncomment lines to download several data files if you want")
        print("3. ./dl_data.sh\n")
        print("4. cd ..")
        spark.stop()
        sys.exit(1)

