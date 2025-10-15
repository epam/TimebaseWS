package deltix.tbwg.webapp.services.genai.models;

import dev.langchain4j.model.azure.AzureOpenAiStreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.request.ChatRequestParameters;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;

public class PerUserAzureStreamingChatModel implements StreamingChatModel {

    private final String endpoint;
    private final String deploymentName;
    private final UserAiApiKeyProvider keyProvider;
    private final ChatRequestParameters defaultParams;

    public PerUserAzureStreamingChatModel(String endpoint,
                                          String deploymentName,
                                          UserAiApiKeyProvider keyProvider) {
        this.endpoint = endpoint;
        this.deploymentName = deploymentName;
        this.keyProvider = keyProvider;
        this.defaultParams = PerUserChatMaker.defaultParams(deploymentName);
    }

    @Override
    public ChatRequestParameters defaultRequestParameters() {
        return defaultParams;
    }

    @Override
    public void doChat(ChatRequest chatRequest, StreamingChatResponseHandler handler) {
        var pr = PerUserChatMaker.prepare(chatRequest);
        String username = pr.username();
        ChatRequest effectiveRequest = pr.request();

        StreamingChatModel model = AzureOpenAiStreamingChatModel.builder()
                .endpoint(endpoint)
                .deploymentName(deploymentName)
                .apiKey(keyProvider.resolve(username))
                .build();

        model.doChat(effectiveRequest, handler);
    }
}
