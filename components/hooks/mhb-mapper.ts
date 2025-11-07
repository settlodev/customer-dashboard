// utils/mhb-mapper.ts

export interface MhbDataMap {
  religion_list: Array<{ religion_id: number; religion_desc: string }>;
  marital_status_list: Array<{ code: string; name: string }>;
  employment_category_list: Array<{ name: string; id: number }>;
  occupation_category_list: Array<{
    occupation_desc: string;
    occupation_id: number;
  }>;
  educational_qualification_list: Array<{
    code: string;
    name: string;
    id: number;
  }>;
  professional_qualifications_list: Array<{
    code: string;
    name: string;
    id: number;
  }>;
  salary_scale_list: Array<{
    code: string;
    from_amt: number;
    id: number;
    to_amt: number;
  }>;
  source_of_fund_list: Array<{ name: string; id: number }>;
  account_products: Array<{ prod_desc: string; prod_id: number }>;
  country_list: Array<{ cntry_cd: string; cntry_id: number; cntry_nm: string }>;
  city_list: Array<{ state_id: number; city_desc: string; city_id: number }>;
  gender_list: Array<{ code: string; name: string }>;
}

export interface FormData {
  // Personal Information
  contact: string;
  marriageFlag: string;
  spouseName?: string;
  religionId: number;
  countryOfBirthId: number;
  addressLine1: string;
  addressCity: string;
  postalCode: string;
  addressFromDate: string;

  // Identification
  idIssueDate: string;
  idExpiryDate: string;
  idCityOfIssue: string;

  // Employment
  employed: boolean;
  employmentCategoryId: number;
  employmentStartYear: number;
  employerName: string;
  occupationId: number;
  employAddressLine: string;
  employmentCity: string;
  employmentAddress: string;

  // Qualification
  qualificationId: number;
  qualificationCode: string;
  professionId: number;
  professionCd: string;
  profQualificationId: number;
  profQualificationCode: string;

  // Financial
  grossAnnualSalId: number;
  sourceOfFundId: number;
  sourceOfFundCd: string;
  accountProductId: number;

  nida: number;
}

export interface MhbApiPayload {
  // Personal Information
  contactNumber: string;
  maritalStatus: string;
  spouseName?: string;
  religion: number;
  countryOfBirth: number;
  addressLine1: string;
  city: string;
  postalCode: string;
  addressFromDate: string;

  // Identification
  idIssueDate: string;
  idExpiryDate: string;
  idPlaceOfIssue: string;

  // Employment
  employmentStatus: boolean;
  employmentCategory: number;
  employmentStartYear: number;
  employerName: string;
  occupation: number;
  employmentAddressLine: string;
  employmentCity: string;
  employmentFullAddress: string;

  // Qualification
  educationQualification: number;
  educationQualificationCode: string;
  profession: number;
  professionCode: string;
  professionalQualification: number;
  professionalQualificationCode: string;

  // Financial
  grossAnnualSalaryRange: number;
  sourceOfFunds: number;
  sourceOfFundsCode: string;
  accountProduct: number;

  // Additional required fields
  nationalId: number;
  customerType: number;
  branch: number;
  title: number;
  gender: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: number;
}

export const mapFormToMhbApi = (
  formData: FormData,
  additionalData: {
    customerType: number;
    branch: number;
    title: number;
    gender: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: number;
  },
): MhbApiPayload => {
  return {
    // Personal Information Mapping
    contactNumber: formData.contact,
    maritalStatus: formData.marriageFlag,
    spouseName: formData.spouseName,
    religion: formData.religionId,
    countryOfBirth: formData.countryOfBirthId,
    addressLine1: formData.addressLine1,
    city: formData.addressCity,
    postalCode: formData.postalCode,
    addressFromDate: formData.addressFromDate,

    // Identification Mapping
    idIssueDate: formData.idIssueDate,
    idExpiryDate: formData.idExpiryDate,
    idPlaceOfIssue: formData.idCityOfIssue,

    // Employment Mapping
    employmentStatus: formData.employed,
    employmentCategory: formData.employmentCategoryId,
    employmentStartYear: formData.employmentStartYear,
    employerName: formData.employerName,
    occupation: formData.occupationId,
    employmentAddressLine: formData.employAddressLine,
    employmentCity: formData.employmentCity,
    employmentFullAddress: formData.employmentAddress,

    // Qualification Mapping
    educationQualification: formData.qualificationId,
    educationQualificationCode: formData.qualificationCode,
    profession: formData.professionId,
    professionCode: formData.professionCd,
    professionalQualification: formData.profQualificationId,
    professionalQualificationCode: formData.profQualificationCode,

    // Financial Mapping
    grossAnnualSalaryRange: formData.grossAnnualSalId,
    sourceOfFunds: formData.sourceOfFundId,
    sourceOfFundsCode: formData.sourceOfFundCd,
    accountProduct: formData.accountProductId,

    // Additional required fields
    nationalId: formData.nida,
    customerType: additionalData.customerType,
    branch: additionalData.branch,
    title: additionalData.title,
    gender: additionalData.gender,
    firstName: additionalData.firstName,
    lastName: additionalData.lastName,
    dateOfBirth: additionalData.dateOfBirth,
    nationality: additionalData.nationality,
  };
};

// Helper functions to get display values
export const getReligionName = (
  religionId: number,
  dataMap: MhbDataMap,
): string => {
  const religion = dataMap.religion_list.find(
    (r) => r.religion_id === religionId,
  );
  return religion?.religion_desc || "";
};

export const getEmploymentCategoryName = (
  categoryId: number,
  dataMap: MhbDataMap,
): string => {
  const category = dataMap.employment_category_list.find(
    (ec) => ec.id === categoryId,
  );
  return category?.name || "";
};

export const getOccupationName = (
  occupationId: number,
  dataMap: MhbDataMap,
): string => {
  const occupation = dataMap.occupation_category_list.find(
    (occ) => occ.occupation_id === occupationId,
  );
  return occupation?.occupation_desc || "";
};

export const getQualificationName = (
  qualificationId: number,
  dataMap: MhbDataMap,
): string => {
  const qualification = dataMap.educational_qualification_list.find(
    (q) => q.id === qualificationId,
  );
  return qualification?.name || "";
};

export const getSourceOfFundName = (
  sourceId: number,
  dataMap: MhbDataMap,
): string => {
  const source = dataMap.source_of_fund_list.find((s) => s.id === sourceId);
  return source?.name || "";
};
