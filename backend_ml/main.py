from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List
import pandas as pd
import numpy as np

# Note: In production, models should be loaded once at startup
# import xgboost as xgb
# import shap

app = FastAPI(
    title="TrueSquare V6 ML Engine",
    description="API FastAPI d'estimation immobilière (XGBoost + SHAP)",
    version="1.0.0"
)

# --- MODELS ---
class SpatialFeatures(BaseModel):
    zone_plui: str = Field(default="UA", description="Zone PLUi (ex: UA, UB)")
    proximite_tram_10m: bool = Field(default=False)
    nuisance_sonore_db: int = Field(default=0, description="Bruit max Lden en dB")

class PropertyFeatures(BaseModel):
    surface: int = Field(..., gt=0, description="Surface habitable en m²")
    pieces: int = Field(..., gt=0, description="Nombre de pièces")
    annee_construction: int = Field(..., description="Année de construction")
    dpe_classe: str = Field(..., description="Classe DPE (A à G)")
    presence_ppt: bool = Field(default=True, description="Plan Pluriannuel de Travaux voté (si copro > 15 ans)")
    fonds_travaux_ok: bool = Field(default=True, description="Fonds de travaux suffisants")

class EstimationRequest(BaseModel):
    property: PropertyFeatures
    spatial: SpatialFeatures

class ShapValue(BaseModel):
    feature: str
    impact_value: float
    description: str

class EstimationResponse(BaseModel):
    prix_base: float
    prix_estime: float
    intervalle_min: float
    intervalle_max: float
    explications_shap: List[ShapValue]


# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"status": "ok", "message": "TrueSquare ML Engine is running."}

@app.post("/predict", response_model=EstimationResponse)
def predict_price(request: EstimationRequest):
    """
    Endpoint principal de prédiction.
    Prend en entrée les caractéristiques du bien et les données spatiales (issues de PostGIS).
    Retourne le prix estimé et la décomposition SHAP.
    """
    try:
        # 1. Conversion des données d'entrée en DataFrame (pour XGBoost)
        # Dans un cas réel, vous passerez ces données à votre modèle XGBoost
        # df = pd.DataFrame([request.model_dump()])

        # 2. Simulation de prédiction XGBoost pour le MVP
        # Prix de base arbitraire basé sur la surface
        prix_base = request.property.surface * 3500.0
        prix_estime = prix_base

        explications = []

        # -- Mock d'impacts (SHAP simulé) --
        
        # Impact Tramway
        if request.spatial.proximite_tram_10m:
            impact_tram = prix_base * 0.05
            prix_estime += impact_tram
            explications.append(ShapValue(
                feature="proximite_tram_10m", 
                impact_value=impact_tram, 
                description="Proximité Tram C (< 10min)"
            ))

        # Impact DPE (Passoire = décote)
        if request.property.dpe_classe in ['F', 'G']:
            impact_dpe = -request.property.surface * 150.0 # Décote empirique travaux
            prix_estime += impact_dpe
            explications.append(ShapValue(
                feature="dpe_classe", 
                impact_value=impact_dpe, 
                description=f"Décote travaux DPE {request.property.dpe_classe}"
            ))

        # Impact Copro (Risque PPT)
        age = 2026 - request.property.annee_construction
        if age > 15 and not request.property.presence_ppt:
            impact_ppt = -15000.0 # Risque financier arbitraire
            prix_estime += impact_ppt
            explications.append(ShapValue(
                feature="presence_ppt", 
                impact_value=impact_ppt, 
                description="Risque Loi Climat (Absence PPT)"
            ))
            
        # Impact Nuisance Sonore
        if request.spatial.nuisance_sonore_db > 65:
            impact_bruit = -prix_base * 0.04
            prix_estime += impact_bruit
            explications.append(ShapValue(
                feature="nuisance_sonore_db", 
                impact_value=impact_bruit, 
                description=f"Nuisance sonore ({request.spatial.nuisance_sonore_db}dB)"
            ))

        # 3. Calcul Intervalle de Confiance (Mock)
        margin = prix_estime * 0.05

        return EstimationResponse(
            prix_base=prix_base,
            prix_estime=prix_estime,
            intervalle_min=prix_estime - margin,
            intervalle_max=prix_estime + margin,
            explications_shap=explications
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Pour lancer en local:
# uvicorn main:app --reload --port 8000
