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
  weekdayFilter: string[] | null;
  frequencyFilter: string;
  locationFilter: string[] | null;
  hideCloseTag: number;
  orderBy: string;
  pageNo: number;
  limit: number;
}
export interface studyDTO {
  title: string;
  studyAbout: string;
  weekday: WeekDayEnum[];
  frequency: FrequencyEnum;
  location: LocationEnum[];
  capacity: number;
  categoryCode: number;
  dueDate: string;
}

export interface searchStudyDTO {
  keyword: string;
  weekdayFilter: string[] | null;
  frequencyFilter: string;
  locationFilter: string[] | null;
  orderBy: string;
}
