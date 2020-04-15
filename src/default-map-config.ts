export default {
  "version": "v1",
  "config": {
    "visState": {
      "filters": [],
      "layers": [
        {
          "id": "hrtxigu",
          "type": "hexagon",
          "config": {
            "dataId": "covid-data",
            "label": "new layer",
            "color": [
              130,
              154,
              227
            ],
            "columns": {
              "lat": "lat",
              "lng": "long"
            },
            "isVisible": true,
            "visConfig": {
              "opacity": 0.8,
              "worldUnitSize": 16,
              "resolution": 8,
              "colorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "coverage": 1,
              "sizeRange": [
                0,
                1000
              ],
              "percentile": [
                0,
                100
              ],
              "elevationPercentile": [
                0,
                100
              ],
              "elevationScale": 82.8,
              "colorAggregation": "sum",
              "sizeAggregation": "average",
              "enable3d": true
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 18,
                "offset": [
                  0,
                  0
                ],
                "anchor": "start",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": {
              "name": "cases",
              "type": "integer"
            },
            "colorScale": "quantile",
            "sizeField": {
              "name": "deathsPer100K",
              "type": "real"
            },
            "sizeScale": "linear"
          }
        }
      ],
      "interactionConfig": {
        "tooltip": {
          "fieldsToShow": {
            "covid-data": [
              "state",
              "subregion",
              "long",
              "population",
              "cases"
            ]
          },
          "enabled": true
        },
        "brush": {
          "size": 0.5,
          "enabled": false
        },
        "coordinate": {
          "enabled": false
        }
      },
      "layerBlending": "normal",
      "splitMaps": [],
      "animationConfig": {
        "currentTime": null,
        "speed": 1
      }
    },
    "mapState": {
      "bearing": 0,
      "dragRotate": true,
      "latitude": 39.15690502140835,
      "longitude": -104.29845290568925,
      "pitch": 0,
      "zoom": 3.9304282529358545,
      "isSplit": false
    },
    "mapStyle": {
      "styleType": "dark",
      "topLayerGroups": {},
      "visibleLayerGroups": {
        "label": false,
        "road": true,
        "border": false,
        "building": true,
        "water": true,
        "land": true,
        "3d building": false
      },
      "threeDBuildingColor": [
        9.665468314072013,
        17.18305478057247,
        31.1442867897876
      ],
      "mapStyles": {}
    }
  }
}