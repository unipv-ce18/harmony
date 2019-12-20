from typing import Any, Callable, List


def make_pipeline(base: Callable[[Any], List], default_projection=None):
    def apply(match_params, offset=0, limit=-1, projection=default_projection) -> List:
        pipeline = base(match_params)
        if offset > 0:
            pipeline.append({'$skip': offset})
        if limit >= 0:
            pipeline.append({'$limit': limit})

        # Apply projection
        if projection is not None:
            pipeline.append({'$project': projection})

        return pipeline

    return apply
