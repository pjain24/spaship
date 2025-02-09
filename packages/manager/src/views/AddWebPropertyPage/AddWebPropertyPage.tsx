/* eslint-disable react/jsx-props-no-spreading */
import { Banner, CustomRadio, CustomRadioContainer } from '@app/components';
import { pageLinks } from '@app/links';
import {
  fetchCmdbCodeById,
  fetchCmdbCodeByName,
  useAddWebProperty
} from '@app/services/webProperty';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ActionGroup,
  Button,
  Checkbox,
  Form,
  FormGroup,
  PageSection,
  Radio,
  Split,
  SplitItem,
  TextInput,
  Tooltip
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as yup from 'yup';
import { addNewWebPropertySchema } from './AddWebProperty.utils';

const schema = addNewWebPropertySchema.shape({
  cmdb: yup
    .string()
    .max(10, 'CMDB code must be 10 characters or less')
    .test('special-chars', 'CMDB code cannot contain special characters', (value) => {
      if (!value) return true;
      return /^[A-Za-z0-9-]+$/.test(value);
    })
    .required('CMDB code is required'),
  severity: yup.string()
});

export interface FormData extends yup.InferType<typeof schema> {}

export type TCmdbValidation = {
  name: string;
  code: string;
  url: string;
  email: string;
  severity: string;
};

export const AddWebPropertyPage = (): JSX.Element => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors }
  } = useForm<FormData>({
    mode: 'onBlur',
    resolver: yupResolver(schema)
  });
  const createWebPropertyMutation = useAddWebProperty();
  const { data: session } = useSession();
  const router = useRouter();
  const [cmdbName, setCmdbName] = useState(false);
  const [cmdbId, setCmdbId] = useState(true);
  const title = watch('title');
  const propertyID = title?.toLowerCase().replaceAll(' ', '-') || '';
  const [cmdbCode, setCmdbCode] = useState('');
  const [cmdbData, setCmdbData] = useState<TCmdbValidation[]>([]);
  const [cmdbError, setCmdbError] = useState(false);
  const [knowCmdbCode, setKnowCmdbCode] = useState<boolean>(false);
  useEffect(() => {
    if ((cmdbCode && cmdbId) || (cmdbCode && cmdbName)) {
      let fetchPromise;

      if (cmdbId) {
        fetchPromise = fetchCmdbCodeById(cmdbCode);
      } else if (cmdbName) {
        fetchPromise = fetchCmdbCodeByName(cmdbCode);
      }

      if (fetchPromise) {
        fetchPromise.then((data) => {
          setCmdbData(data);
          if (data.length === 0) {
            setCmdbError(true);
          } else {
            setCmdbError(false);
          }
        });
      }
    }
  }, [cmdbCode, cmdbName, cmdbId]);

  const handleChangecmdbName = () => {
    setCmdbName(true);
    setCmdbId(false);
  };

  const handleChangecmdbId = () => {
    setCmdbId(true);
    setCmdbName(false);
  };

  const onFormSubmit = async (data: FormData) => {
    const updatedData = {
      ...data,
      cmdbCode: cmdbData[0]?.code || 'NA',
      severity: cmdbData[0]?.severity || 'NA'
    };

    try {
      await createWebPropertyMutation.mutateAsync({
        ...updatedData,
        env: data.env?.toLowerCase() || '',
        identifier: propertyID,
        createdBy: session?.user?.email || ''
      });
      toast.success('Web Property Created');
      router.push(pageLinks.webPropertyDetailPage.replace('[propertyIdentifier]', propertyID));
    } catch (error) {
      toast.error('Failed to create property');
    }
  };
  const isCmdbCodeValid = cmdbCode !== '';

  return (
    <>
      <Banner title="Add New Web Property" backRef={pageLinks.webPropertyListPage} />
      <PageSection isCenterAligned isWidthLimited className="pf-u-px-lg">
        <Form onSubmit={handleSubmit(onFormSubmit)} style={{ maxWidth: '720px' }}>
          <Controller
            control={control}
            name="title"
            defaultValue=""
            render={({ field, fieldState: { error } }) => (
              <FormGroup
                label="Title"
                isRequired
                fieldId="property-title"
                validated={error ? 'error' : 'default'}
                helperTextInvalid={error?.message}
                helperText="Title shouldn't contain any special-character"
              >
                <TextInput
                  isRequired
                  placeholder="Enter Title"
                  type="text"
                  id="property-title"
                  {...field}
                />
              </FormGroup>
            )}
          />
          <FormGroup label="Identifier" fieldId="property-identifier">
            <TextInput
              isReadOnly
              type="text"
              id="property-id"
              placeholder="Autogenerated from property title"
              value={propertyID}
            />
          </FormGroup>
          <Controller
            control={control}
            defaultValue=""
            name="url"
            render={({ field, fieldState: { error } }) => (
              <FormGroup
                label="Hostname"
                isRequired
                fieldId="property-host"
                validated={error ? 'error' : 'default'}
                helperTextInvalid={error?.message}
                helperText="Hostname should be a valid url (eg: one.redhat.com)"
              >
                <TextInput
                  isRequired
                  placeholder="Enter URL of property"
                  type="text"
                  id="property-host"
                  {...field}
                />
              </FormGroup>
            )}
          />
          <Split hasGutter>
            <SplitItem isFilled>
              <Controller
                control={control}
                name="env"
                defaultValue=""
                render={({ field, fieldState: { error } }) => (
                  <FormGroup
                    label="Environment Name"
                    isRequired
                    fieldId="property-env"
                    validated={error ? 'error' : 'default'}
                    helperTextInvalid={error?.message}
                    helperText="Environment Name shouldn't contain any space, numbers, special-character "
                  >
                    <TextInput
                      isRequired
                      placeholder="Default Environment Name"
                      type="text"
                      id="property-env"
                      {...field}
                    />
                  </FormGroup>
                )}
              />
            </SplitItem>
            <SplitItem>
              <Controller
                control={control}
                name="cluster"
                defaultValue="preprod"
                render={({ field: { onChange, value } }) => (
                  <FormGroup
                    role="radiogroup"
                    label="Environment Type"
                    isInline
                    fieldId="property-env-type"
                  >
                    <CustomRadioContainer>
                      <CustomRadio
                        name="basic-inline-radio"
                        label="Pre-Prod"
                        id="pre-prod-radio"
                        isChecked={value === 'preprod'}
                        isSelected={value === 'preprod'}
                        onChange={() => onChange('preprod')}
                      />
                      <CustomRadio
                        name="basic-inline-radio"
                        label="Prod"
                        id="prod-radio"
                        isChecked={value === 'prod'}
                        isSelected={value === 'prod'}
                        onChange={() => onChange('prod')}
                      />
                    </CustomRadioContainer>
                  </FormGroup>
                )}
              />
            </SplitItem>
          </Split>
          <Split hasGutter>
            <SplitItem isFilled>
              <Controller
                control={control}
                name="cmdb"
                render={({ fieldState: { error }, field }) => (
                  <FormGroup
                    label={
                      <>
                        CMDB Code
                        <Tooltip
                          content={<div>Please provide the CMDB code for your application.</div>}
                        >
                          <span>
                            &nbsp; <InfoCircleIcon style={{ color: '#6A6E73' }} />
                          </span>
                        </Tooltip>
                      </>
                    }
                    isRequired
                    fieldId="property-cmdb"
                    validated={error ? 'error' : 'default'}
                    helperTextInvalid={error?.message}
                    helperText="CMDB code can contain only letters, numbers, and dashes are allowed"
                  >
                    <TextInput
                      isRequired
                      placeholder="Enter cmdb code"
                      type="text"
                      id="property-cmdb"
                      value={cmdbData.length > 0 ? cmdbData[0]?.code : cmdbCode}
                      onChange={(value) => {
                        setCmdbCode(value);
                        field.onChange(value);
                      }}
                    />
                  </FormGroup>
                )}
              />
            </SplitItem>

            <SplitItem className="pf-u-mt-lg">
              <Radio
                isChecked={cmdbId}
                name="Cmdb Id"
                onChange={handleChangecmdbId}
                label="CMDB Id"
                id="cmdb-id"
                required={isCmdbCodeValid}
              />
            </SplitItem>
            <SplitItem className="pf-u-mt-lg">
              <Radio
                isChecked={cmdbName}
                name="Cmdb Name"
                onChange={handleChangecmdbName}
                label="CMDB Name"
                id="cmdb-name"
                required={isCmdbCodeValid}
              />
            </SplitItem>
          </Split>
          {/* //TO DO: remove the Inline CSS in Code revamp */}
          {cmdbError && (
            <p style={{ color: '#c9190b', fontFamily: 'REDHATTEXT', fontSize: '14px' }}>
              The entered CMDB code is incorrect. Please verify the value you entered and the
              selected type.
            </p>
          )}
          <Split hasGutter>
            <SplitItem>
              <Controller
                control={control}
                name="severity"
                defaultValue=""
                render={({ fieldState: { error }, field }) => (
                  <FormGroup
                    label="Application Severity"
                    isRequired
                    fieldId="property-sev"
                    validated={error ? 'error' : 'default'}
                    helperTextInvalid={error?.message}
                  >
                    <TextInput
                      isRequired
                      placeholder="Severity of the application"
                      type="text"
                      id="property-sev"
                      value={cmdbData[0]?.severity || 'NA'}
                      isDisabled
                      onChange={(value) => {
                        setCmdbCode(value);
                        field.onChange(value);
                      }}
                    />
                  </FormGroup>
                )}
              />
            </SplitItem>
          </Split>
          <Split hasGutter>
            <SplitItem>
              <Checkbox
                label="Unfamiliar with the CMDB code for an application, but still want to onboard?"
                isChecked={knowCmdbCode}
                onChange={(checked) => setKnowCmdbCode(checked)}
                id="controlled-check-1"
                name="check1"
              />
            </SplitItem>
          </Split>
          {knowCmdbCode && (
            <div>
              Please get in touch with the{' '}
              <strong>
                <a href="https://app.slack.com/client/T027F3GAJ/C04F5PRKEMC">SPAship team</a>
              </strong>{' '}
              through the <strong>SPAship Forum</strong> to begin the onboarding process for your
              Single Page Application (SPA) on this platform. You have the option to take advantage
              of spaship&apos;s preview environments for this purpose.
            </div>
          )}
          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              isDisabled={cmdbError || Object.keys(errors).length !== 0}
            >
              Create
            </Button>
            <Link href={pageLinks.webPropertyListPage}>
              <a>
                <Button variant="link">Cancel</Button>
              </a>
            </Link>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
