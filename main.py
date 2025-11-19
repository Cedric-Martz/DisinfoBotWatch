import src.init_spark as init_spark

if __name__ == "__main__":
    df = init_spark.init()
    df.show()