function setIntensities(cI, eI, aI)
{
   spectrometerMC.continuousMC._alpha = 100 * cI;
   spectrometerMC.emissionMC._alpha = 100 * eI;
   spectrometerMC.absorptionMC._alpha = 100 * aI;
}
