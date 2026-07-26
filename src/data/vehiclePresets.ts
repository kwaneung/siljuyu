import type { FuelType } from "@/lib/fuel/types";

export type VehiclePreset = {
  id: string;
  model: string;
  fuelType: FuelType;
  officialKmPerL: number;
  note?: string;
};

// 공인/복합 연비 참고값으로 구성한 v1 프리셋입니다. 실사용자는 온보딩에서 직접 보정할 수 있습니다.
export const VEHICLE_PRESETS: VehiclePreset[] = [
  {
    id: "grandeur-30-gasoline",
    model: "그랜저 3.0 가솔린",
    fuelType: "B027",
    officialKmPerL: 10.8,
  },
  {
    id: "sonata-20-gasoline",
    model: "쏘나타 2.0 가솔린",
    fuelType: "B027",
    officialKmPerL: 12.7,
  },
  {
    id: "avante-16-gasoline",
    model: "아반떼 1.6 가솔린",
    fuelType: "B027",
    officialKmPerL: 15.4,
  },
  {
    id: "k5-20-gasoline",
    model: "K5 2.0 가솔린",
    fuelType: "B027",
    officialKmPerL: 13.0,
  },
  {
    id: "santafe-22-diesel",
    model: "싼타페 2.2 디젤",
    fuelType: "D047",
    officialKmPerL: 13.4,
  },
  {
    id: "sorento-22-diesel",
    model: "쏘렌토 2.2 디젤",
    fuelType: "D047",
    officialKmPerL: 14.1,
  },
  {
    id: "tucson-16-gasoline",
    model: "투싼 1.6 가솔린",
    fuelType: "B027",
    officialKmPerL: 12.5,
  },
  {
    id: "carnival-35-gasoline",
    model: "카니발 3.5 가솔린",
    fuelType: "B027",
    officialKmPerL: 9.1,
  },
  {
    id: "ray-10-gasoline",
    model: "레이 1.0 가솔린",
    fuelType: "B027",
    officialKmPerL: 13.0,
  },
  {
    id: "spark-10-gasoline",
    model: "스파크 1.0 가솔린",
    fuelType: "B027",
    officialKmPerL: 14.4,
  },
  {
    id: "sm6-lpg",
    model: "SM6 2.0 LPG",
    fuelType: "K015",
    officialKmPerL: 9.5,
  },
];
