export interface ciiAdditionalIdentifier {
    id: string;
    legalName: string;
    scheme: string
}

export interface CiiDto {
    name: string;
    contactPoint: CiiContactPoint;
    identifier: CiiIdentifier;
    address: CiiAddress;
    additionalIdentifiers: CiiAdditionalIdentifier[];
}

export interface CiiContactPoint {
    email: string;
    faxNumber: string;
    name: string;
    telephone: string;
    uri: string
}

export interface CiiIdentifier {
    id: string;
    legalName: string;
    scheme: string;
    uri: string;
}

export interface CiiAddress {
    countryName: string;
    locality: string;
    postalCode: string;
    region: string;
    streetAddress: string;
}

export interface CiiAdditionalIdentifier {
    id: string;
    legalName: string;
    scheme: string;
}