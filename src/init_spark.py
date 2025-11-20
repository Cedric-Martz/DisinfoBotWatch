from pyspark.sql import SparkSession
from pyspark.sql.functions import col

def init():
    spark = SparkSession.builder \
        .appName("DisinfoBotWatch") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("ERROR")

    return spark.read.csv("data/IRAhandle_tweets_*.csv", header=True, inferSchema=True)

