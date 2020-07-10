
def make_query_regex(query: str):
    return ''.join([f'(?=.*{word})' for word in query.split()])
