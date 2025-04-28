"use client";
import { useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import { Style, Icon, Stroke } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import 'ol/ol.css';

const OLMap = ({ markers = [], polyline = [], onClick }) => {
  const mapRef = useRef();
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([31.053028, -17.824858]), // Harare coordinates
        zoom: 6
      })
    });

    // Add click handler
    mapInstance.current.on('click', (event) => {
      const coords = toLonLat(event.coordinate);
      if (onClick) onClick(coords);
    });

    // Add features
    const updateFeatures = () => {
      // Clear existing layers
      mapInstance.current.getLayers().getArray()
        .filter(layer => layer.get('type') === 'vector')
        .forEach(layer => mapInstance.current.removeLayer(layer));

      // Add markers
      const markerSource = new VectorSource();
      markers.forEach(({ lat, lng }) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([lng, lat]))
        });
        markerSource.addFeature(feature);
      });

      const markerLayer = new VectorLayer({
        source: markerSource,
        style: new Style({
          image: new Icon({
            src: 'https://docs.maptiler.com/openlayers/default-marker/marker-icon.png',
            scale: 0.8
          })
        }),
        properties: { type: 'vector' }
      });

      // Add polyline
      const routeSource = new VectorSource();
      if (polyline.length > 0) {
        const line = new LineString(
          polyline.map(({ lat, lng }) => fromLonLat([lng, lat]))
        );
        routeSource.addFeature(new Feature(line));
      }

      const routeLayer = new VectorLayer({
        source: routeSource,
        style: new Style({
          stroke: new Stroke({
            color: '#1890ff',
            width: 3
          })
        }),
        properties: { type: 'vector' }
      });

      // Add layers to map
      mapInstance.current.addLayer(markerLayer);
      mapInstance.current.addLayer(routeLayer);
    };

    updateFeatures();

    return () => mapInstance.current?.setTarget(undefined);
  }, [markers, polyline]);

  return <div ref={mapRef} className="w-full h-[400px] rounded-lg border" />;
};

export default OLMap;