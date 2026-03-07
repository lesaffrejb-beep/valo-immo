import geopandas as gpd
import warnings

# Ignorer les warnings de pyproj pour une console plus propre
warnings.filterwarnings('ignore')

def main():
    shp_path = "dataset/N_BRUIT_ZBR_INFRA_R_A_LD_S_049.shp"
    contour_path = "contour-angers.geojson"
    out_path = "angers-nuisances-lden.geojson"

    # 1. Charger le Shapefile depuis le dossier dataset/
    print(f"Chargement du Shapefile : {shp_path}...")
    noise_data = gpd.read_file(shp_path)

    # 2. Reprojeter le Shapefile en EPSG:4326 (WGS 84)
    print("Reprojection du Shapefile en EPSG:4326...")
    noise_data = noise_data.to_crs(epsg=4326)

    # 3. Charger le polygone de contour
    print(f"Chargement du polygone de découpe : {contour_path}...")
    angers_contour = gpd.read_file(contour_path)
    
    # Sécurité pour être certain de la projection
    if angers_contour.crs and angers_contour.crs.to_string() != "EPSG:4326":
        angers_contour = angers_contour.to_crs(epsg=4326)

    # 4. Effectuer un "Clip" (intersection spatiale)
    print("Découpage des nuisances sur le périmètre d'Angers (Clip)...")
    clipped_noise = gpd.clip(noise_data, angers_contour)

    # 5. Sauvegarder le résultat final
    print(f"Sauvegarde en cours dans : {out_path}...")
    clipped_noise.to_file(out_path, driver="GeoJSON")
    print("Terminé avec succès !")

if __name__ == "__main__":
    main()
