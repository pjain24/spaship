import { feedbackReq } from '@app/config/feedbackReq';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useRef } from 'react';

const body = (variables: any) => {
  const query = `
    mutation (
      $projectId: String
      $summary: String
      $experience: String
      $category: FeedbackCategory
      $stackInfo: StackInfoInput
      $userId: String
      $error: String
    ) {
      createFeedback(
        input: {
          projectId: $projectId
          summary: $summary
          experience: $experience
          category: $category
          createdBy: $userId
          stackInfo: $stackInfo
          error: $error
        }
      ) {
        summary
        ticketUrl
        error
        stackInfo {
          path
          stack
        }
      }
    }
  `;
  return JSON.stringify({
    query,
    variables
  });
};

const createFeedback = async (variables: any): Promise<any> => {
  const { data } = await feedbackReq.post(``, body(variables));
  return data.data;
};

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation(createFeedback, {});
};
