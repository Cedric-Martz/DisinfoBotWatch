from pyspark.sql import SparkSession

def init():
    spark = SparkSession.builder \
        .appName("DisinfoBotWatch") \
        .config("spark.driver.memory", "4g") \
        .config("spark.executor.memory", "4g") \
        .config("spark.sql.shuffle.partitions", "100") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("ERROR")

    return spark.read.csv("data/IRAhandle_tweets_*.csv", header=True, inferSchema=True)

