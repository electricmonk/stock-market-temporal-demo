import {builderFor} from "ts-byob";
import {PolygonResponse, PolygonSMAValue, SMAData} from "../types";

export const anSMAValue = builderFor<PolygonSMAValue>( () => {
    return {
        timestamp: Date.now(),
        value: Math.random() * 100
    }
})

export const anSMADatum = builderFor<SMAData>( () => {
    return {
        timestamp: Date.now(),
        value: Math.round(Math.random() * 100)
    }
})


export const aPolygonResponse = (values: PolygonSMAValue[]) => {
    return {
        results: {
            underlying: {
                url: "https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/1634688000000/1637280000000"
            },
            values
        },
        status: "OK",
        request_id: "123abc",
        next_url: "https://api.polygon.io/v1/indicators/sma/AAPL?cursor=abc123"
    }
};