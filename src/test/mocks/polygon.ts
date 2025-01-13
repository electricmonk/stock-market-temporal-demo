export const mockPolygonResponse = {
    results: {
        underlying: {
            url: "https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/1634688000000/1637280000000"
        },
        values: [
            {
                timestamp: 1637193600000,
                value: 153.49
            },
            {
                timestamp: 1637107200000,
                value: 151.28
            }
        ]
    },
    status: "OK",
    request_id: "123abc",
    next_url: "https://api.polygon.io/v1/indicators/sma/AAPL?cursor=abc123"
};