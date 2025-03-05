// Definizione di diversi stili di basemap
const basemaps = {
  "OpenStreetMap": {
    name: "OpenStreetMap",
    style: {
      version: 8,
      glyphs: "https://raw.githubusercontent.com/latidudemaps/maplibre_template/main/data/fonts/{fontstack}/{range}.pbf",
      sprite: "https://raw.githubusercontent.com/latidudemaps/GeologiaVDA/main/data/sprites/sprite",
      sources: {
        basemap: {
          type: "raster",
          tiles: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "&copy; OpenStreetMap contributors",
          maxzoom: 19
        },
        "terrain-source": {
          "type": "raster-dem",
          "tiles": [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          "tileSize": 256,
          "attribution": "Terrain data &copy; AWS Terrain Tiles",
          "maxzoom": 15
        }
      },
      layers: [
        {
          id: "basemap",
          type: "raster",
          source: "basemap"
        }
      ],
      terrain: {
        source: "terrain-source",
        exaggeration: 0.15
      }
    }
  },
  "Dark": {
    name: "Dark",
    style: {
      version: 8,
      glyphs: "https://raw.githubusercontent.com/latidudemaps/maplibre_template/main/data/fonts/{fontstack}/{range}.pbf",
      sprite: "https://raw.githubusercontent.com/latidudemaps/GeologiaVDA/main/data/sprites/sprite",
      sources: {
        basemap: {
          type: "raster",
          tiles: [
            "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "&copy; CARTO Dark",
          maxzoom: 19
        },
        "terrain-source": {
          "type": "raster-dem",
          "tiles": [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          "tileSize": 256,
          "attribution": "Terrain data &copy; AWS Terrain Tiles",
          "maxzoom": 15
        }
      },
      layers: [
        {
          id: "basemap",
          type: "raster",
          source: "basemap"
        }
      ],
      terrain: {
        source: "terrain-source",
        exaggeration: 0.15
      }
    }
  },
  "Light": {
    name: "Light",
    style: {
      version: 8,
      glyphs: "https://raw.githubusercontent.com/latidudemaps/maplibre_template/main/data/fonts/{fontstack}/{range}.pbf",
      sprite: "https://raw.githubusercontent.com/latidudemaps/GeologiaVDA/main/data/sprites/sprite",
      sources: {
        basemap: {
          type: "raster",
          tiles: [
            "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "&copy; CARTO Light",
          maxzoom: 19
        },
        "terrain-source": {
          "type": "raster-dem",
          "tiles": [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          "tileSize": 256,
          "attribution": "Terrain data &copy; AWS Terrain Tiles",
          "maxzoom": 15
        }
      },
      layers: [
        {
          id: "basemap",
          type: "raster",
          source: "basemap"
        }
      ],
      terrain: {
        source: "terrain-source",
        exaggeration: 0.15
      }
    }
  }
};

export default basemaps;