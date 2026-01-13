<p align="center">
  <img src="./resources/moto-2.png" alt="App Home" width="200" />
  <img src="./resources/moto-3.png" alt="App Pending" width="200" />
  <img src="./resources/moto-4.png" alt="App Accepted" width="200" />
  <img src="./resources/moto-5.png" alt="App In Progress" width="200" />
</p>

# Moto — Rickshaw Taxi App

Moto is a local rickshaw (auto) taxi app that connects riders with nearby drivers for short, affordable urban trips. Built with Expo + React Native and powered by EAS, this repository contains the app code, assets, and scripts used to build and publish Moto.

# How Moto works

```mermaid
sequenceDiagram
    participant Client
    participant MotoApp
    participant Driver

    Client->>MotoApp: Request Ride
    MotoApp->>Driver: Notify Driver
    Driver->>MotoApp: Accept Ride
    MotoApp->>Client: Confirm Driver
    Driver->>MotoApp: Update Location
    MotoApp->>Client: Track Driver
    Driver->>MotoApp: Complete Ride
    MotoApp->>Client: Notify Completion

    Note over Client,MotoApp: Local-first: Data stored locally
    Note over MotoApp,Driver: Privacy-first: Interchange only minimal data
```

## What Moto does
- Book rickshaw rides quickly (pickup within minutes)
- Live driver tracking and simple in-app communication
- Transparent fares and ETAs
- Cash and card payments with ride history
- Driver ratings and safety features

## Quick start (this repo)
1. Install dependencies:

```bash
pnpm install
```

2. Run locally (Expo):

```bash
pnpm start
```

3. Build for production with EAS:

```bash
pnpm run build:prod
```

4. Over The Air (OTA) updates with EAS Update:

```bash
eas update --branch production
```

5. Submit to Play Store with EAS Submit:

```bash
eas submit -p android --latest
```

## Minimum Play Console items (first publish)
- Production: start rollout (e.g. 1 (0.0.1))
- Countries/regions: add at least one (e.g. Peru)
- Store listings: language(s) and default listing (e.g. es-419 with app name "Moto")
- App content: content rating questionnaire, target audience (13+), privacy policy URL, ads declaration, data safety questionnaire
- Store settings: app category (Travel & Local)

## 📬 Connect with Binni Cordova

PortFolio
- [binnicordova.com](https://binnicordova.com)

Feel free to reach out if you have any questions or need support. Call [ +1 (650) 374-4225 ](tel:+16503744225) and ask for Binni Cordova.

Contact him:
- [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-%230072b1?logo=linkedin)](https://www.linkedin.com/in/binnicordova)
- [![Calendar](https://img.shields.io/badge/Calendar-Book%20a%20Meeting-%23FF7F50?logo=google-calendar)](https://calendly.com/binnizenobiocordovaleandro/meet)
- [![GitHub](https://img.shields.io/badge/GitHub-Profile-%23808080?logo=github)](https://github.com/binnizenobiocordovaleandro)
- [![Email](https://img.shields.io/badge/Email-Send%20Mail-%23FF5722?logo=gmail)](mailto:binnizenobiocordovaleandro@gmail.com)
- [![Phone](https://img.shields.io/badge/Phone-Call-%234CAF50?logo=phone)](tel:+1-650-374-4225)

