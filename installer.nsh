; installer.nsh — inclus par electron-builder dans le script NSIS.
; Importe le certificat public XYVEL Medical dans les magasins de confiance
; de l'UTILISATEUR courant (pas besoin d'admin), pour que l'application
; signée n'apparaisse plus comme "éditeur inconnu" sur le PC cible.
;
; Le fichier xyvel-medical.cer est embarqué via "extraResources" (package.json)
; et se retrouve dans $INSTDIR\resources\xyvel-medical.cer.

!macro customInstall
  nsExec::Exec 'certutil -user -addstore -f "Root" "$INSTDIR\resources\xyvel-medical.cer"'
  nsExec::Exec 'certutil -user -addstore -f "TrustedPublisher" "$INSTDIR\resources\xyvel-medical.cer"'
!macroend

!macro customUnInstall
  ; On NE retire PAS le certificat à la désinstallation (cf. MigraineLog) :
  ; le garder est sans danger (c'est ton propre éditeur).
!macroend
