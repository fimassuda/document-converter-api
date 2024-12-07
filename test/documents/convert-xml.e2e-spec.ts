import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import { SupportedFileType } from '../../src/documents/enums/supported-file-type.enum';

describe('Document Conversion (e2e)', () => {
  let app: INestApplication;
  let exampleTxt: string;
  let exampleXml: string;
  let exampleJson: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Load example files
    exampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <ProductID>
    <ProductID1>4</ProductID1>
    <ProductID2>8</ProductID2>
    <ProductID3>15</ProductID3>
    <ProductID4>16</ProductID4>
    <ProductID5>23</ProductID5>
  </ProductID>
  <ProductID>
    <ProductID1>a</ProductID1>
    <ProductID2>b</ProductID2>
    <ProductID3>c</ProductID3>
    <ProductID4>d</ProductID4>
    <ProductID5>e</ProductID5>
  </ProductID>
  <AddressID>
    <AddressID1>42</AddressID1>
    <AddressID2>108</AddressID2>
    <AddressID3>3</AddressID3>
    <AddressID4>14</AddressID4>
  </AddressID>
  <ContactID>
    <ContactID1>59</ContactID1>
    <ContactID2>26</ContactID2>
  </ContactID>
</root>`;

    exampleJson = JSON.stringify({
      ProductID: [
        {
          ProductID1: '4',
          ProductID2: '8',
          ProductID3: '15',
          ProductID4: '16',
          ProductID5: '23'
        },
        {
          ProductID1: 'a',
          ProductID2: 'b',
          ProductID3: 'c',
          ProductID4: 'd',
          ProductID5: 'e'
        }
      ],
      AddressID: [
        {
          AddressID1: '42',
          AddressID2: '108',
          AddressID3: '3',
          AddressID4: '14'
        }
      ],
      ContactID: [
        {
          ContactID1: '59',
          ContactID2: '26'
        }
      ]
    });

    exampleTxt = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~AddressID*42*108*3*14~ContactID*59*26';
  });

  afterEach(async () => {
    await app.close();
  });

  it('should convert string to XML', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: exampleTxt,
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.XML,
        lineSeparator: '~',
        elementSeparator: '*',
      })
      .expect(200)
      .expect('Content-Type', /xml/)
      .then(response => {
        // Remove whitespace and newlines for comparison
        const expectedXml = exampleXml.replace(/\s+/g, '');
        const actualXml = response.text.replace(/\s+/g, '');
        expect(actualXml).toBe(expectedXml);
      });
  });

  it('should convert XML to JSON', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: exampleXml,
        convertFrom: SupportedFileType.XML,
        convertTo: SupportedFileType.JSON,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        const expectedObj = {
          root: JSON.parse(exampleJson)
        };
        const actualObj = JSON.parse(response.text);
        expect(actualObj).toEqual(expectedObj);
      });
  });

  it('should handle invalid string input', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: 'invalid*format~data',
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.XML,
        // Missing required separators
      })
      .expect(400);
  });

  it('should handle invalid XML input', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: '<invalid>xml<document',  // Missing closing bracket
        convertFrom: SupportedFileType.XML,
        convertTo: SupportedFileType.JSON,
      })
      .expect(400)
      .expect(response => {
        expect(response.body.message).toContain('Invalid XML');
      });
  });
});