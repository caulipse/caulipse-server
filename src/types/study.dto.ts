import {
  WeekDayEnum,
  FrequencyEnum,
  LocationEnum,
} from '../entity/StudyEntity';

export enum orderByEnum {
  LATEST = 'latest',
  SMALL_VACANCY = 'small_vacancy',
  LARGE_VACANCY = 'large_vacancy',
  LAST = 'oldest',
}

export interface paginationDTO {
  categoryCode: number;
  frequencyFilter: string;
  weekdayFilter: string;
  locationFilter: string;
  hideCloseTag: number;
  orderBy: string;
  pageNo: number;
  limit: number;
}
export interface studyDTO {
  title: string;
  studyAbout: string;
  weekday: WeekDayEnum;
  frequency: FrequencyEnum;
  location: LocationEnum;
  capacity: number;
  categoryCode: number;
  dueDate: string;
}

export interface searchStudyDTO {
  keyword: string;
  frequencyFilter: string;
  weekdayFilter: string;
  locationFilter: string;
  orderBy: string;
}
