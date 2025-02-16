import React, { useEffect, useRef, useState } from "react";
import { Map, MapBrowserEvent, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { useGeographic } from "ol/proj";

import "ol/ol.css";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { GeoJSON } from "ol/format";
import { Fill, Stroke, Style } from "ol/style";
import { Point } from "ol/geom";
import CircleStyle from "ol/style/Circle";

useGeographic();
const schoolStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "blue" }),
    stroke: new Stroke({ color: "white", width: 2 }),
  }),
});
const unFocusedSchoolStyle = new Style({
  image: new CircleStyle({
    radius: 0,
  }),
});
const focusedStyle = () =>
  new Style({
    stroke: new Stroke({
      width: 3,
    }),
    /* text: new Text(({
        text: feature.getProperties().name,
        fill: new Fill({color: "green"}),
        stroke: new Stroke({color: "white", width:2})
      })),*/
    fill: new Fill({
      color: "gold",
    }),
  });
const unFocusedStyle = () =>
  new Style({
    stroke: new Stroke({
      width: 5,
      color: "crimson",
    }),
  });
const osmLayer = new TileLayer({ source: new OSM() });
const municipalityLayer = new VectorLayer({
  source: new VectorSource({
    url: "/kws2100-exercise/geojson/kommuner.geojson",
    format: new GeoJSON(),
  }),
  style: unFocusedStyle,
});
const schoolLayer = new VectorLayer({
  source: new VectorSource({
    url: "/kws2100-exercise/geojson/skoler.geojson",
    format: new GeoJSON(),
  }),
  style: unFocusedSchoolStyle,
});
const map = new Map({
  view: new View({ center: [10.8, 59.9], zoom: 7 }),
  layers: [osmLayer, municipalityLayer, schoolLayer],
});

export function Application() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [municipalityName, setMunicipalityName] = useState<string | null>(null);
  const [best, setBest] = useState(false);
  const [skoleTall, setSkoleTall] = useState<number>(0);

  let layerOn = true;
  function handlePointerMove(event: MapBrowserEvent<MouseEvent>) {
    if (layerOn) {
      municipalityLayer
        .getSource()
        ?.forEachFeature((feature) => feature.setStyle(unFocusedStyle()));
      municipalityLayer
        .getSource()
        ?.getFeaturesAtCoordinate(event.coordinate)
        .forEach((feature) => {
          feature.setStyle(focusedStyle);
        });
    }
  }
  function handleLayerClick() {
    if (layerOn) {
      municipalityLayer.setVisible(false);
      layerOn = false;
    } else {
      municipalityLayer.setVisible(true);
      layerOn = true;
    }
  }
  function handleClick(event: MapBrowserEvent<MouseEvent>) {
    municipalityLayer
      .getSource()
      ?.getFeaturesAtCoordinate(event.coordinate)
      .forEach((feature) => {
        const name = feature.getProperties()["name"] ?? "her er det ikke noe";
        setMunicipalityName(name);

        const municipalityGeometry = feature.getGeometry();
        if (!municipalityGeometry) return;
        let count = 0;
        schoolLayer.getSource()?.forEachFeature((school) => {
          const schoolGeometry = school.getGeometry();
          if (schoolGeometry instanceof Point) {
            if (
              municipalityGeometry.intersectsCoordinate(
                schoolGeometry.getCoordinates(),
              )
            ) {
              school.setStyle(schoolStyle);
              count++;
            } else {
              school.setStyle(unFocusedSchoolStyle);
            }
          }
        });
        setSkoleTall(count);
        if (name === "Bærum") {
          setBest(true);
        } else {
          setBest(false);
        }
      });
  }

  useEffect(() => {
    map.setTarget(mapRef.current!);
    map.on("pointermove", handlePointerMove);
    map.on("click", handleClick);
  }, []);

  return (
    <>
      <div>
        {best ? (
          <h1 style={{ color: "gold" }}>
            Det er {skoleTall} skoler i {municipalityName} kommune.
          </h1>
        ) : (
          <h1 style={{ color: "black" }}>
            Det er {skoleTall} skoler i {municipalityName} kommune.
          </h1>
        )}
        <button onClick={handleLayerClick}>Skru av/på kommuner</button>

        <div ref={mapRef}></div>
      </div>
    </>
  );
}
